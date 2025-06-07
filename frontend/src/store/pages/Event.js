// src/pages/Event.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Modal, message } from 'antd';
import SeatingMap from '../components/SeatingMap'; // al inicio
import { fetchMapa, fetchPlantillaPrecios, fetchZonas } from '../services/apistore';
import Header from '../../components/Header';

const Event = ({ onShowLoginModal, onLogin, onLogout }) => {
  const userId = localStorage.getItem('userId');
  const { id } = useParams();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [plantillaPrecios, setPlantillaPrecios] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${id}`);
        const data = await response.json();
        setEvento(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };
    fetchEvento();
  }, [id]);

  useEffect(() => {
    const fetchFunciones = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/funcions');
        const data = await response.json();
        setFunciones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching functions:', error);
      }
    };
    fetchFunciones();
  }, []);

  useEffect(() => {
    const fetchAllZonas = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/funcions/");
        const funciones = await response.json();
  
        if (!Array.isArray(funciones)) throw new Error("Funciones not found");
  
        // Extraer zonas de todas las plantillas
        const zonasMap = new Map();
  
        funciones.forEach((funcion) => {
          const detalles = funcion?.plantilla?.detalles || [];
          detalles.forEach((detalle) => {
            if (detalle.zonaId && !zonasMap.has(detalle.zonaId)) {
              zonasMap.set(detalle.zonaId, detalle);
            }
          });
        });
  
        const zonasUnicas = Array.from(zonasMap.values());
        setZonas(zonasUnicas); // Esto depende de cómo quieras estructurarlas visualmente
  
      } catch (error) {
        console.error("Error fetching zonas desde funciones:", error);
        message.error("Error al cargar zonas: " + error.message);
      }
    };
  
    fetchAllZonas();
  }, []);
  
  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/payments');
        const data = await response.json();
        setPagos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPagos([]);
      }
    };
    fetchPagos();
  }, []);

  useEffect(() => {
    const cargarDatosSeleccionados = async () => {
      if (!selectedFunctionId) return;
      const funcion = funciones.find(f => f._id === selectedFunctionId);
      if (!funcion) return;

      try {
        const mapaData = await fetchMapa(funcion.sala._id);
        const mapaActualizado = {
          ...mapaData,
          contenido: mapaData.contenido.map(elemento => ({
            ...elemento,
            sillas: elemento.sillas.map(silla => {
              const pagoAsiento = pagos.find(pago =>
                Array.isArray(pago.seats) && pago.seats.some(seat => seat.id === silla._id)
              );

              if (pagoAsiento) {
                const estado = pagoAsiento.status;
                return {
                  ...silla,
                  estado,
                  color:
                    estado === "bloqueado" ? "orange" :
                    estado === "reservado" ? "red" :
                    estado === "pagado" ? "gray" : "lightblue"
                };
              }
              return silla;
            })
          }))
        };

        setMapa(mapaActualizado);

        if (funcion.plantilla?.id || funcion.plantilla?._id) {
          const plantillaData = await fetchPlantillaPrecios(funcion.plantilla._id);
          setPlantillaPrecios(plantillaData);
        }
      } catch (error) {
        console.error('Error loading selected data:', error);
      }
    };
    cargarDatosSeleccionados();
  }, [selectedFunctionId, funciones, pagos]);

  const toggleSillaEnCarrito = (silla, mesa) => {
    if (!silla.zona || ["reservado", "pagado", "bloqueado"].includes(silla.estado)) {
      message.error("Este asiento no está disponible.");
      return;
    }

    const precio = plantillaPrecios?.detalles.find(p => p.zonaId === silla.zona)?.precio || 100;
    const zonaNombre = zonas.find(z => z._id === silla.zona)?.nombre || "Desconocida";

    const index = carrito.findIndex(item => item._id === silla._id);
    const nuevoCarrito = index !== -1
      ? carrito.filter(item => item._id !== silla._id)
      : [...carrito, { ...silla, precio, nombreMesa: mesa.nombre, zona: zonaNombre }];

    setCarrito(nuevoCarrito);

    const updatedMapa = {
      ...mapa,
      contenido: mapa.contenido.map(elemento => ({
        ...elemento,
        sillas: elemento.sillas.map(s => ({
          ...s,
          color: nuevoCarrito.some(item => item._id === s._id) ? "green" : "lightblue"
        }))
      }))
    };

    setMapa(updatedMapa);
  };

  const handlePayment = async () => {
    if (!userId) {
      onShowLoginModal();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      onShowLoginModal();
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user: userId,
          seats: carrito.map(item => ({
            id: item._id,
            name: item.nombreMesa,
            price: item.precio,
            zone: item.zona
          })),
          status: "reservado"
        }),
      });

      if (!response.ok) throw new Error('Failed to process payment');

      const data = await response.json();
      console.log(data);
      message.success("Pago realizado con éxito.");
      setCarrito([]);
      setIsPaymentModalVisible(false);
    } catch (error) {
      console.error("Error en la solicitud:", error);
      message.error("Error al procesar el pago.");
    }
  };

  return (
    <div className="p-4">
      <Header onShowLoginModal={onShowLoginModal} onLogin={onLogin} onLogout={onLogout} />

      <h1 className="text-2xl font-bold text-center my-4">{evento?.nombre}</h1>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Funciones</h3>
        <div className="flex flex-col gap-2">
          {funciones.map(funcion => (
            <label key={funcion._id} className="flex items-center gap-2">
              <input
                type="radio"
                name="funcion"
                value={funcion._id}
                onChange={() => setSelectedFunctionId(funcion._id)}
              />
              <span>{funcion.evento?.nombre} - {new Date(funcion.fechaCelebracion).toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="my-6 border rounded shadow-md p-4 flex justify-center bg-gray-100">
        <SeatingMap mapa={mapa} onClickSilla={toggleSillaEnCarrito} />
      </div>

      <div className="bg-white p-4 rounded shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-3">Carrito</h2>
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 mb-2 rounded">
            <span>{item.zona} - {item.nombreMesa} - Silla {index + 1} - ${item.precio}</span>
            <button
              onClick={() => toggleSillaEnCarrito(item)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </div>
        ))}
        <button
          onClick={() => setIsPaymentModalVisible(true)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Reservar
        </button>
      </div>

      <Modal
        title="Confirmar Reserva"
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        onOk={handlePayment}
      >
        <p>¿Deseas reservar estos asientos?</p>
      </Modal>
    </div>
  );
};

export default Event;