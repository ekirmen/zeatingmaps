import React, { useState } from 'react';
import ModoDeVenta from './ModulosConfVentas/ModoDeVenta';
import VentaDeZonas from './ModulosConfVentas/VentaDeZonas';
import RegistroObligatorio from './ModulosConfVentas/RegistroObligatorio';
import EstadoDeVenta from './ModulosConfVentas/EstadoDeVenta';
import DatosCompradorObligatorios from './ModulosConfVentas/DatosCompradorObligatorios';

const ConfiguracionVenta = ({ eventoData, setEventoData }) => {
  return (
    <div className="tab-content">
      <h3>Configuración de venta</h3>
      {/* Add your sales configuration form fields here */}
    </div>
  );
};

export default ConfiguracionVenta;
