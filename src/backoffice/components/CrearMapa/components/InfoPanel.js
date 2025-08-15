import React from 'react';

const InfoPanel = ({
  elements,
  selectedElements
}) => {
  const countByType = elements.reduce((acc, element) => {
    acc[element.type] = (acc[element.type] || 0) + 1;
    return acc;
  }, {});

  const unlabeledSeats = elements.filter(el => 
    el.type === 'silla' && !el.numero
  ).length;

  const unlabeledTables = elements.filter(el => 
    el.type === 'mesa' && !el.nombre
  ).length;

  return (
    <div className="info-panel">
      <div className="error-title">Acciones pendientes</div>
      
      <div className="info-item">
        <span className="info-count">{unlabeledSeats}</span>
        <span>Asientos sin numeración</span>
        <a href="#" className="info-link">
          <i className="fas fa-eye"></i>
        </a>
      </div>
      
      <div className="info-item">
        <span className="info-count">{unlabeledTables}</span>
        <span>Mesas sin numeración</span>
      </div>

      <div className="info-item">
        <span className="info-count">{elements.length}</span>
        <span>Total de elementos</span>
      </div>

      <div className="info-item">
        <span className="info-count">{selectedElements.length}</span>
        <span>Elementos seleccionados</span>
      </div>

      {countByType.silla && (
        <div className="info-item">
          <span className="info-count">{countByType.silla}</span>
          <span>Asientos</span>
        </div>
      )}

      {countByType.mesa && (
        <div className="info-item">
          <span className="info-count">{countByType.mesa}</span>
          <span>Mesas</span>
        </div>
      )}

      {countByType.zone && (
        <div className="info-item">
          <span className="info-count">{countByType.zone}</span>
          <span>Zonas</span>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
