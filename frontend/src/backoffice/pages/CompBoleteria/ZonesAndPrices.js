import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala } from '../../services/apibackoffice';

const ZonesAndPrices = ({ selectedFuncion, selectedClient, carrito, setCarrito }) => {
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [plantillasPrecios, setPlantillasPrecios] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [preciosZona, setPreciosZona] = useState([]);
  const [selectedZona, setSelectedZona] = useState(null);
  const [selectedPrecio, setSelectedPrecio] = useState(null);
  const [ticketType, setTicketType] = useState('normal'); // normal o courtesy

  // Cargar plantillas de precios cuando cambia la sala
  useEffect(() => {
    const cargarPlantillasPrecios = async () => {
      if (selectedFuncion?.sala?._id) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/plantillas/recinto/${selectedFuncion.sala.recinto}/sala/${selectedFuncion.sala._id}`
          );
          if (response.ok) {
            const data = await response.json();
            setPlantillasPrecios(data);
          }
        } catch (error) {
          console.error('Error loading price templates:', error);
        }
      }
    };
    cargarPlantillasPrecios();
  }, [selectedFuncion]);

  // Cargar plantilla de precios específica de la función
  useEffect(() => {
    const cargarPlantillaPrecios = async () => {
      if (selectedFuncion?._id) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/funcions/${selectedFuncion._id}/plantilla`
          );
          if (response.ok) {
            const data = await response.json();
            setPlantillasPrecios([data]);
            setSelectedPlantilla(data);
            setPreciosZona(data.detalles);
          }
        } catch (error) {
          console.error('Error loading function price template:', error);
          message.error('Error loading price template');
        }
      }
    };
    cargarPlantillaPrecios();
  }, [selectedFuncion]);

  // Cargar mapa y zonas de la sala
  useEffect(() => {
    const loadSalaData = async () => {
      if (selectedFuncion?.sala?._id) {
        try {
          const [mapaData, zonasData] = await Promise.all([
            fetchMapa(selectedFuncion.sala._id),
            fetchZonasPorSala(selectedFuncion.sala._id)
          ]);

          if (mapaData && typeof mapaData === 'object') {
            setMapa(mapaData);
          }

          if (Array.isArray(zonasData)) {
            const validatedZonas = zonasData.map(zona => ({
              ...zona,
              nombre: zona.nombre || 'Unnamed Zone'
            }));
            setZonas(validatedZonas);
          }
        } catch (error) {
          message.error('Error loading sala data');
          setMapa(null);
          setZonas([]);
        }
      }
    };
    loadSalaData();
  }, [selectedFuncion]);

  // Seleccionar un precio (zona) para comprar
  const handlePrecioSelect = (detallePrecio) => {
    const zona = zonas.find(z => z._id === detallePrecio.zonaId);
    setSelectedZona(zona);
    setSelectedPrecio(detallePrecio);
    setPreciosZona(detallePrecio);
  };

  // Al hacer clic en una silla, agregar o quitar del carrito
  const handleSeatClick = (silla, mesa) => {
    if (!selectedClient) {
      message.warning('Please select a client first');
      return;
    }

    if (!selectedPrecio) {
      message.warning('Please select a price first');
      return;
    }

    const seatInCart = carrito.find(item => item._id === silla._id);
    if (seatInCart) {
      setCarrito(carrito.filter(item => item._id !== silla._id));
    } else {
      setCarrito([...carrito, {
        ...silla,
        nombreMesa: mesa.nombre,
        zona: selectedZona.nombre,
        precio: ticketType === 'courtesy' ? 0 : selectedPrecio.precio,
        tipoPrecio: ticketType,
        plantillaId: selectedPlantilla._id
      }]);
    }
  };

  // Zonas disponibles para mostrar en el SeatingMap (filtrado)
  const availableZonas = selectedPlantilla?.detalles.map(detalle => detalle.zonaId) || [];

  return (
    <div className="center-content">
      <div className="price-templates-section">
        <h3>Function Price Template</h3>
        {selectedPlantilla ? (
          <div className="template-card selected">
            <h4>{selectedPlantilla.nombre}</h4>
            <div className="price-details">
              {selectedPlantilla.detalles.map(detalle => {
                const zona = zonas.find(z => z._id === detalle.zonaId);
                return (
                  <div
                    key={detalle._id}
                    className={`price-item ${selectedPrecio?._id === detalle._id ? 'selected' : ''}`}
                    onClick={() => handlePrecioSelect(detalle)}
                  >
                    <div className="price-item-content">
                      <span>{zona ? zona.nombre : `Unknown Zone (ID: ${detalle.zonaId})`}</span>
                      <span>${detalle.precio}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p>No price template assigned to this function</p>
        )}
      </div>

      <SeatingMap
        mapa={mapa}
        onSeatClick={handleSeatClick}
        selectedZona={selectedZona}
        availableZonas={selectedZona ? [selectedZona._id] : []}
      />
    </div>
  );
};

export default ZonesAndPrices;
