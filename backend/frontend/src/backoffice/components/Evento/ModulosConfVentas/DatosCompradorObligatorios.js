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
  const handleSolicitarChange = (e) => {
    const { name, checked } = e.target;
    updateDatosComprador(name, 'solicitado', checked);
    if (!checked) {
      updateDatosComprador(name, 'obligatorio', false);
    }
  };

  const handleObligatorioChange = (e) => {
    const { name, checked } = e.target;
    updateDatosComprador(name, 'obligatorio', checked);
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
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Dato</th>
              <th className="text-center">Solicitar</th>
              <th className="text-center">Obligatorio</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(datosComprador).map((key) => (
              <tr key={key} className="border-t">
                <td>{labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    name={key}
                    checked={datosComprador[key].solicitado}
                    onChange={handleSolicitarChange}
                  />
                </td>
                <td className="text-center">
                  {datosComprador[key].solicitado && (
                    <input
                      type="checkbox"
                      name={key}
                      checked={datosComprador[key].obligatorio}
                      onChange={handleObligatorioChange}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DatosCompradorObligatorios;
