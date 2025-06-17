// PopupCrearPlantilla.js
import React, { useState, useEffect } from 'react';
import { useRecintoSala } from '../contexts/RecintoSalaContext';
import './PopupCrearPlantilla.css';
const PopupCrearPlantilla = ({ closePopup }) => {
  const { recinto, sala } = useRecintoSala();

  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [activo, setActivo] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [precio, setPrecio] = useState('');
  const [comision, setComision] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [canal, setCanal] = useState('');
  const [orden, setOrden] = useState('');

  useEffect(() => {
    // Simulación de obtener zonas del servidor para la sala y recinto
    if (recinto && sala) {
      fetch(`/api/zonas/sala/${sala}`)
        .then((res) => res.json())
        .then((data) => setZonas(data))
        .catch((error) => console.error('Error al obtener zonas', error));

      fetch('/api/entradas')
        .then((res) => res.json())
        .then((productos) => setProductos(productos))
        .catch((error) => console.error('Error al obtener productos', error));
    }
  }, [recinto, sala]);

  const handleGuardar = () => {
    console.log({
      nombrePlantilla,
      activo,
      zonaSeleccionada,
      productoSeleccionado,
      precio,
      comision,
      precioOriginal,
      canal,
      orden
    });
    closePopup();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Crear Plantilla</h2>

        <input
          type="text"
          placeholder="Nombre Plantilla"
          value={nombrePlantilla}
          onChange={(e) => setNombrePlantilla(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          Activo
        </label>

        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Comisión Usuario</th>
              <th>Precio Original</th>
              <th>Canal</th>
              <th>Orden</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select
                  onChange={(e) => setZonaSeleccionada(e.target.value)}
                >
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.nombre}>
                      {zona.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                >
                  {productos.map((entrada) => (
                    <option key={entrada.id} value={entrada.nombre}>
                      {entrada.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  placeholder="Precio"
                  type="number"
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </td>
              <td>
                <input
                  placeholder="Comisión"
                  type="number"
                  onChange={(e) => setComision(e.target.value)}
                />
              </td>
              <td>
                <input
                  placeholder="Precio Original"
                  type="number"
                  onChange={(e) => setPrecioOriginal(e.target.value)}
                />
              </td>
              <td>
                <input placeholder="Canal" onChange={(e) => setCanal(e.target.value)} />
              </td>
              <td>
                <input placeholder="Orden" type="number" onChange={(e) => setOrden(e.target.value)} />
              </td>
              <td>
                <button>···</button>
              </td>
            </tr>
          </tbody>
        </table>

        <button onClick={() => closePopup()}>Cancelar</button>
        <button onClick={handleGuardar}>Guardar</button>
      </div>
    </div>
  );
};

export default PopupCrearPlantilla;
