import React, { useState, useEffect } from 'react';
import ModoDeVenta from './ModulosConfVentas/ModoDeVenta';
import VentaDeZonas from './ModulosConfVentas/VentaDeZonas';
import RegistroObligatorio from './ModulosConfVentas/RegistroObligatorio';
import EstadoDeVenta from './ModulosConfVentas/EstadoDeVenta';
import DatosCompradorObligatorios from './ModulosConfVentas/DatosCompradorObligatorios';
import DatosPorBoleto from './ModulosConfVentas/DatosPorBoleto';

const ConfiguracionVenta = ({ eventoData, setEventoData }) => {
  const [mostrarDatosComprador, setMostrarDatosComprador] = useState(false);
  const [datosComprador, setDatosComprador] = useState({
    nombre: { solicitado: false, obligatorio: false },
    email: { solicitado: false, obligatorio: false },
    telefono: { solicitado: false, obligatorio: false },
    rut: { solicitado: false, obligatorio: false },
    numeroIdentificacionFiscal: { solicitado: false, obligatorio: false },
    direccion: { solicitado: false, obligatorio: false },
    nombreFonetico: { solicitado: false, obligatorio: false },
    apellidosFoneticos: { solicitado: false, obligatorio: false },
    idioma: { solicitado: false, obligatorio: false },
    fechaNacimiento: { solicitado: false, obligatorio: false },
    sexo: { solicitado: false, obligatorio: false },
    empresa: { solicitado: false, obligatorio: false },
    departamento: { solicitado: false, obligatorio: false },
    cargoEmpresa: { solicitado: false, obligatorio: false },
    matricula: { solicitado: false, obligatorio: false },
    twitter: { solicitado: false, obligatorio: false },
    facebook: { solicitado: false, obligatorio: false },
    youtube: { solicitado: false, obligatorio: false },
    tiktok: { solicitado: false, obligatorio: false },
    snapchat: { solicitado: false, obligatorio: false },
    instagram: { solicitado: false, obligatorio: false },
    contactoEmergencia: { solicitado: false, obligatorio: false },
    nacionalidad: { solicitado: false, obligatorio: false }
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


    if (!eventoData) return;
    setMostrarDatosComprador(eventoData.mostrarDatosComprador || false);
    setMostrarDatosBoleto(eventoData.mostrarDatosBoleto || false);
    if (eventoData.datosComprador) {
      setDatosComprador(prev => ({ ...prev, ...eventoData.datosComprador }));
    }
    if (eventoData.datosBoleto) {
      setDatosBoleto(prev => ({ ...prev, ...eventoData.datosBoleto }));
    }
  }, [eventoData]);

  const updateDatosComprador = (field, prop, value) => {
    setDatosComprador(prev => ({
      ...prev,
      [field]: { ...prev[field], [prop]: value },
    }));
    setEventoData(prev => ({
      ...prev,
      datosComprador: {
        ...prev.datosComprador,
        [field]: { ...prev.datosComprador[field], [prop]: value },
      },
    }));
  };

  const updateDatosBoleto = (field, value) => {
    setDatosBoleto(prev => ({ ...prev, [field]: value }));
    setEventoData(prev => ({
      ...prev,
      datosBoleto: { ...prev.datosBoleto, [field]: value }
    }));
  };

  const setAllDatosSolicitados = (checked) => {
    const updatedDatos = Object.keys(datosComprador).reduce((acc, key) => {
      const current = datosComprador[key];
      acc[key] = {
        solicitado: checked,
        obligatorio: checked ? current.obligatorio : false
      };
      return acc;
    }, {});

    setDatosComprador(updatedDatos);
    setEventoData(prev => ({
      ...prev,
      datosComprador: updatedDatos
    }));
  };

  const setAllDatosObligatorios = (checked) => {
    const updatedDatos = Object.keys(datosComprador).reduce((acc, key) => {
      const current = datosComprador[key];
      acc[key] = {
        solicitado: checked ? true : current.solicitado,
        obligatorio: checked ? true : false
      };
      return acc;
    }, {});

    setDatosComprador(updatedDatos);
    setEventoData(prev => ({
      ...prev,
      datosComprador: updatedDatos
    }));
  };

  const toggleMostrarDatosComprador = () => {
    setMostrarDatosComprador(prev => {
      const nuevo = !prev;
      setEventoData(prevData => {
        let updated = { ...prevData, mostrarDatosComprador: nuevo };
        if (!nuevo) {
          const { datosComprador, ...rest } = updated;
          updated = rest;
        } else {
          updated.datosComprador = prevData.datosComprador || datosComprador;
        }
        return updated;
      });
      if (!nuevo) {
        const cleared = Object.keys(datosComprador).reduce((acc, key) => {
          acc[key] = { solicitado: false, obligatorio: false };
          return acc;
        }, {});
        setDatosComprador(cleared);
      }
      return nuevo;
    });
  };

  const toggleMostrarDatosBoleto = () => {
    setMostrarDatosBoleto(prev => {
      const nuevo = !prev;
      setEventoData(prevData => {
        let updated = { ...prevData, mostrarDatosBoleto: nuevo };
        if (!nuevo) {
          const { datosBoleto, ...rest } = updated;
          updated = rest;
        } else {
          updated.datosBoleto = prevData.datosBoleto || datosBoleto;
        }
        return updated;
      });
      if (!nuevo) {
        const cleared = Object.keys(datosBoleto).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        setDatosBoleto(cleared);
      }
      return nuevo;
    });
  };

  return (
    <div className="tab-content configuracion-venta space-y-6">
      <ModoDeVenta eventoData={eventoData} setEventoData={setEventoData} />
      <VentaDeZonas />
      <RegistroObligatorio eventoData={eventoData} setEventoData={setEventoData} />
      <EstadoDeVenta eventoData={eventoData} setEventoData={setEventoData} />
      <DatosCompradorObligatorios
        mostrarDatos={mostrarDatosComprador}
        toggleMostrarDatos={toggleMostrarDatosComprador}
        datosComprador={datosComprador}
        updateDatosComprador={updateDatosComprador}
        setAllDatosSolicitados={setAllDatosSolicitados}
        setAllDatosObligatorios={setAllDatosObligatorios}
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
