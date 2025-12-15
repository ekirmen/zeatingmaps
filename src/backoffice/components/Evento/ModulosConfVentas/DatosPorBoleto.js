import React from 'react';

const labels = {
  rutTitular: 'Recoger el RUT del titular del boleto',
  idPasaporte: 'ID/pasaporte del titular único',
  nombreTitular: 'Recoger nombre y apellidos del titular del boleto',
  verificarEmail: 'Verificar email',
  verificacionEmail: 'Verificación de email',
  pregunta1: 'Pregunta personalizada 1',
  pregunta2: 'Pregunta personalizada 2',
};

const DatosPorBoleto = ({ mostrarDatos, toggleMostrarDatos, datosBoleto, updateDatosBoleto }) => {
  const handleChange = e => {
    const { name, checked } = e.target;
    updateDatosBoleto(name, checked);
  };

  return (
    <div className="datos-boleto bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={mostrarDatos}
          onChange={toggleMostrarDatos}
          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
        />
        <h3 className="text-xl font-semibold text-gray-800">Datos recogidos por boleto</h3>
      </div>
      {mostrarDatos && (
        <div className="space-y-3">
          {Object.keys(datosBoleto).map(key => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                name={key}
                checked={datosBoleto[key]}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">{labels[key] || key}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatosPorBoleto;
