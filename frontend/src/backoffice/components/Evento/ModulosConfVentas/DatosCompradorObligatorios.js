import React from 'react';

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
                {key.replace(/([A-Z])/g, ' $1').trim()} {/* Formateo de texto */}
              </label>
            </div>
          ))}
        </form>
      )}
    </div>
  );
};

export default DatosCompradorObligatorios;
