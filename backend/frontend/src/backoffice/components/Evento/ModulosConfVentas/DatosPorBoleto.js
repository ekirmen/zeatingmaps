import React from 'react';

const labels = {
  rutTitular: 'Recoger el RUT del titular del boleto',
  idPasaporte: 'ID/pasaporte del titular único',
  nombreTitular: 'Recoger nombre y apellidos del titular del boleto',
  verificarEmail: 'Verificar email',
  verificacionEmail: 'Verificación de email',
  pregunta1: 'Pregunta personalizada 1',
  pregunta2: 'Pregunta personalizada 2'
};

const DatosPorBoleto = ({
  mostrarDatos,
  toggleMostrarDatos,
  datosBoleto,
  updateDatosBoleto
}) => {
  const handleChange = (e) => {
    const { name, checked } = e.target;
    updateDatosBoleto(name, checked);
  };

  return (
    <div className="datos-boleto">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={mostrarDatos}
          onChange={toggleMostrarDatos}
        />
        <h3>Datos recogidos por boleto</h3>
      </div>
      {mostrarDatos && (
        <form>
          {Object.keys(datosBoleto).map((key) => (
            <div key={key} className="form-group">
              <label>
                <input
                  type="checkbox"
                  name={key}
                  checked={datosBoleto[key]}
                  onChange={handleChange}
                />
                {labels[key] || key}
              </label>
            </div>
          ))}
        </form>
      )}
    </div>
  );
};

export default DatosPorBoleto;
