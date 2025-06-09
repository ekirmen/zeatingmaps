import React, { useState } from 'react';
import ModoDeVenta from './ModulosConfVentas/ModoDeVenta';
import VentaDeZonas from './ModulosConfVentas/VentaDeZonas';
import RegistroObligatorio from './ModulosConfVentas/RegistroObligatorio';
import EstadoDeVenta from './ModulosConfVentas/EstadoDeVenta';
import DatosCompradorObligatorios from './ModulosConfVentas/DatosCompradorObligatorios';
import DatosPorBoleto from './ModulosConfVentas/DatosPorBoleto';

const ConfiguracionVenta = ({ eventoData, setEventoData }) => {
  const [mostrarDatosComprador, setMostrarDatosComprador] = useState(false);
  const [datosComprador, setDatosComprador] = useState({
    nombre: false,
    email: false,
    telefono: false,
    rut: false,
    numeroIdentificacionFiscal: false,
    direccion: false,
    nombreFonetico: false,
    apellidosFoneticos: false,
    idioma: false,
    fechaNacimiento: false,
    sexo: false,
    empresa: false,
    departamento: false,
    cargoEmpresa: false,
    matricula: false,
    twitter: false,
    facebook: false,
    youtube: false,
    tiktok: false,
    snapchat: false,
    instagram: false,
    contactoEmergencia: false,
    nacionalidad: false
  });

  const [mostrarDatosBoleto, setMostrarDatosBoleto] = useState(false);
  const [datosBoleto, setDatosBoleto] = useState({
    rutTitular: false,
    idPasaporte: false,
    nombreTitular: false,
    verificarEmail: false,
    verificacionEmail: false,
    pregunta1: false,
    pregunta2: false
  });

  const updateDatosComprador = (field, value) => {
    setDatosComprador(prev => ({ ...prev, [field]: value }));
    setEventoData(prev => ({
      ...prev,
      datosComprador: { ...prev.datosComprador, [field]: value }
    }));
  };

  const updateDatosBoleto = (field, value) => {
    setDatosBoleto(prev => ({ ...prev, [field]: value }));
    setEventoData(prev => ({
      ...prev,
      datosBoleto: { ...prev.datosBoleto, [field]: value }
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

  const toggleMostrarDatosBoleto = () => {
    setMostrarDatosBoleto(prev => {
      const nuevo = !prev;
      if (!nuevo) {
        const cleared = Object.keys(datosBoleto).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        setDatosBoleto(cleared);
        setEventoData(prevData => ({
          ...prevData,
          datosBoleto: cleared,
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
      <DatosPorBoleto
        mostrarDatos={mostrarDatosBoleto}
        toggleMostrarDatos={toggleMostrarDatosBoleto}
        datosBoleto={datosBoleto}
        updateDatosBoleto={updateDatosBoleto}
      />
    </div>
  );
};

export default ConfiguracionVenta;
