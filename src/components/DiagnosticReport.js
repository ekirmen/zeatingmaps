import React from 'react';

const DiagnosticReport = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div className="diagnostic-report">
      <div className="diagnostic-header">
        <h3>Reporte de Diagnóstico</h3>
        {onClose && (
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        )}
      </div>
      <div className="diagnostic-content">
        <p><strong>Estado:</strong> {report.status}</p>
        <p><strong>Mensaje:</strong> {report.message}</p>
        <p><strong>Timestamp:</strong> {report.timestamp}</p>
      </div>
    </div>
  );
};

export default DiagnosticReport;
