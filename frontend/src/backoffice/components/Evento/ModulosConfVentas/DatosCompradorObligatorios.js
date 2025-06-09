import React from 'react';

const labels = {
  nombre: 'Nombre',
  email: 'Email',
  telefono: 'Teléfono',
  rut: 'RUT',
  numeroIdentificacionFiscal: 'Número de identificación fiscal',
  direccion: 'Dirección / C.P.',
  nombreFonetico: 'Nombre fonético',
  apellidosFoneticos: 'Apellidos fonéticos',
  idioma: 'Idioma',
  fechaNacimiento: 'Fecha de nacimiento',
  sexo: 'Sexo',
  empresa: 'Empresa',
  departamento: 'Departamento',
  cargoEmpresa: 'Cargo en la empresa',
  matricula: 'Matrícula',
  twitter: 'Twitter',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  instagram: 'Instagram',
  contactoEmergencia: 'Contacto de emergencia',
  nacionalidad: 'Nacionalidad'
};

const DatosCompradorObligatorios = ({
  mostrarDatos,
  toggleMostrarDatos,
  datosComprador,
  updateDatosComprador,
}) => {
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    updateDatosComprador(name, checked);
  };

  return (
    <div className="datos-comprador-obligatorios">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={mostrarDatos}
          onChange={toggleMostrarDatos}
        />
        <h3>Datos del Comprador Obligatorios</h3>
      </div>
      {mostrarDatos && (
        <form>
          {Object.keys(datosComprador).map((key) => (
            <div key={key} className="form-group">
              <label>
                <input
                  type="checkbox"
                  name={key}
                  checked={datosComprador[key]}
                  onChange={handleCheckboxChange}
                />
                {labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          ))}
        </form>
      )}
    </div>
  );
};

export default DatosCompradorObligatorios;
