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
  setAllDatosSolicitados,
  setAllDatosObligatorios
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

  const allSolicitados = Object.values(datosComprador).every((dato) => dato.solicitado);
  const allObligatorios = Object.values(datosComprador).every((dato) => dato.solicitado && dato.obligatorio);

  return (
    <div className="datos-comprador-obligatorios bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={mostrarDatos}
          onChange={toggleMostrarDatos}
          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
        />
        <h3 className="text-xl font-semibold text-gray-800">Datos del Comprador Obligatorios</h3>
      </div>
      {mostrarDatos && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dato</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSolicitados}
                      onChange={(e) => setAllDatosSolicitados(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                    />
                    <span>Solicitar</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={allObligatorios}
                      onChange={(e) => setAllDatosObligatorios(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                    />
                    <span>Obligatorio</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(datosComprador).map((key) => (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">{labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      name={key}
                      checked={datosComprador[key].solicitado}
                      onChange={handleSolicitarChange}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {datosComprador[key].solicitado ? (
                      <input
                        type="checkbox"
                        name={key}
                        checked={datosComprador[key].obligatorio}
                        onChange={handleObligatorioChange}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatosCompradorObligatorios;
