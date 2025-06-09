import React, { useState } from 'react';
import ModoDeVenta from './ModulosConfVentas/ModoDeVenta';
import VentaDeZonas from './ModulosConfVentas/VentaDeZonas';
import RegistroObligatorio from './ModulosConfVentas/RegistroObligatorio';
import EstadoDeVenta from './ModulosConfVentas/EstadoDeVenta';
import DatosCompradorObligatorios from './ModulosConfVentas/DatosCompradorObligatorios';

const ConfiguracionVenta = ({ eventoData, setEventoData }) => {
  const [mostrarDatosComprador, setMostrarDatosComprador] = useState(false);
  const [datosComprador, setDatosComprador] = useState({
    nombre: false,
    email: false,
    telefono: false,
    rut: false
  });

  const updateDatosComprador = (field, value) => {
    setDatosComprador(prev => ({ ...prev, [field]: value }));
    setEventoData(prev => ({
      ...prev,
      datosComprador: { ...prev.datosComprador, [field]: value }
    }));
  };

  const toggleMostrarDatosComprador = () => {
    setMostrarDatosComprador(prev => {
      const nuevo = !prev;
      if (!nuevo) {
        const cleared = Object.keys(datosComprador).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        setDatosComprador(cleared);
        setEventoData(prevData => ({
          ...prevData,
          datosComprador: cleared,
        }));
      }
      return nuevo;
    });
  };

  return (
    <div className="tab-content configuracion-venta space-y-6">
      <ModoDeVenta eventoData={eventoData} setEventoData={setEventoData} />
      <VentaDeZonas />
      <RegistroObligatorio />
      <EstadoDeVenta />
      <DatosCompradorObligatorios
        mostrarDatos={mostrarDatosComprador}
        toggleMostrarDatos={toggleMostrarDatosComprador}
        datosComprador={datosComprador}
        updateDatosComprador={updateDatosComprador}
      />
    </div>
  );
};

export default ConfiguracionVenta;
