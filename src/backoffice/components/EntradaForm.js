import React, { useState } from 'react';
import { useRecinto } from '../contexts/RecintoContext';
import { useIva } from '../contexts/IvaContext';  // Asegúrate de que la ruta sea correcta

const EntradaForm = ({ onClose, onSave }) => {
  const { recintos } = useRecinto();
  const { ivaList } = useIva();  // Usa el hook useIva correctamente

  const [selectedRecinto, setSelectedRecinto] = useState('');
  const [productName, setProductName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [ticketType, setTicketType] = useState('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(10);
  const [selectedIva, setSelectedIva] = useState('');

  const handleSave = () => {
    const newTicket = {
      recinto: selectedRecinto,
      name: productName,
      active: isActive,
      type: ticketType,
      min: minQuantity,
      max: maxQuantity,
      iva: selectedIva,
    };
    onSave(newTicket);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Añadir Ticket</h3>
        <label>Recinto</label>
        <select value={selectedRecinto} onChange={(e) => setSelectedRecinto(e.target.value)}>
          <option value="">Selecciona un recinto</option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.name}>
              {recinto.name}
            </option>
          ))}
        </select>

        <label>Producto</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Nombre del ticket"
        />

        <div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label>Activo</label>
        </div>

        <hr />

        <label>Tipo de Ticket</label>
        <div>
          <label>
            <input
              type="radio"
              value="General"
              checked={ticketType === 'General'}
              onChange={(e) => setTicketType(e.target.value)}
            />
            General
            <small> - Precio general.</small>
          </label>
          <label>
            <input
              type="radio"
              value="Reducido"
              checked={ticketType === 'Reducido'}
              onChange={(e) => setTicketType(e.target.value)}
            />
            Reducido
            <small> - Precio con descuento para niños o jubilados.</small>
          </label>
          {/* Agrega más tipos según sea necesario */}
        </div>

        <div>
          <h5>Opciones</h5>
          <label>IVA</label>
          <select value={selectedIva} onChange={(e) => setSelectedIva(e.target.value)}>
            <option value="">Selecciona IVA</option>
            {ivaList.map((iva) => (
              <option key={iva.id} value={iva.value}>
                {iva.name}
              </option>
            ))}
          </select>

          <label>Cantidad mínima de venta</label>
          <input
            type="number"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            style={{ width: '45%', marginRight: '10%' }}
          />
          <label>Cantidad máxima de venta</label>
          <input
            type="number"
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(e.target.value)}
            style={{ width: '45%' }}
          />
        </div>

        <div>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default EntradaForm;
