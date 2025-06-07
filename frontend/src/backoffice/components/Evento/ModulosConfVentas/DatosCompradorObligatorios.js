import React from 'react';

const DatosCompradorObligatorios = ({ datosComprador, updateDatosComprador }) => {
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    updateDatosComprador(name, checked);
  };

  return (
    <div className="datos-comprador-obligatorios">
      <h3>Datos del Comprador Obligatorios</h3>
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
              {key.replace(/([A-Z])/g, ' $1').trim()} {/* Formateo de texto */}
            </label>
          </div>
        ))}
      </form>
    </div>
  );
};

export default DatosCompradorObligatorios;
