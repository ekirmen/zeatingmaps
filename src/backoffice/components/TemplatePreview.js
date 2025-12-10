import React from 'react';
import { Card, Typography, Space, Tag } from '../../utils/antdComponents';
import { PrinterOutlined } from '@ant-design/icons';

const { Title } = Typography;

const TemplatePreview = ({ template, ticketData }) => {
  const generatePreviewText = () => {
    if (!template || !ticketData) return '';

    let preview = '';

    // Encabezado
    if (template.header) {
      preview += template.header + '\n';
    }

    // Datos del ticket
    preview += `Evento: ${ticketData.eventName}\n`;
    preview += `Fecha: ${ticketData.eventDate}\n`;
    preview += `Hora: ${ticketData.eventTime}\n`;
    preview += `Asiento: ${ticketData.seatNumber}\n`;
    preview += `Zona: ${ticketData.zoneName}\n`;
    preview += `Precio: $${ticketData.price}\n`;
    preview += `Ticket #: ${ticketData.ticketNumber}\n`;

    // Pie de p¡gina
    if (template.footer) {
      preview += template.footer + '\n';
    }

    return preview;
  };

  const getTemplateInfo = () => {
    if (!template) return {};

    return {
      width: template.paperWidth,
      height: template.paperHeight,
      fontSize: template.fontSize === '00' ? 'Normal' : 'Doble',
      alignment: template.alignment === '1' ? 'Centro' : 'Izquierda',
      qrCode: template.showQRCode ? 'S­' : 'No',
      barcode: template.showBarcode ? 'S­' : 'No'
    };
  };

  const info = getTemplateInfo();

  return (
    <div className="template-preview">
      <Card 
        title={
          <Space>
            <PrinterOutlined />
            <span>Vista Previa de Plantilla</span>
          </Space>
        }
        className="mb-4"
      >
        <div className="preview-container">
          <div className="preview-ticket" style={{ width: `${template?.paperWidth || 80}px` }}>
            <pre className="preview-text">
              {generatePreviewText()}
            </pre>
          </div>
        </div>

        <div className="template-info mt-4">
          <Title level={5}>Especificaciones de la Plantilla:</Title>
          <Space wrap>
            <Tag color="blue">Ancho: {info.width}mm</Tag>
            <Tag color="green">Alto: {info.height}mm</Tag>
            <Tag color="orange">Fuente: {info.fontSize}</Tag>
            <Tag color="purple">Alineaci³n: {info.alignment}</Tag>
            <Tag color="cyan">QR Code: {info.qrCode}</Tag>
            <Tag color="magenta">C³digo de Barras: {info.barcode}</Tag>
          </Space>
        </div>
      </Card>

      <style jsx>{`
        .preview-container {
          display: flex;
          justify-content: center;
          margin: 16px 0;
        }
        
        .preview-ticket {
          background: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 16px;
          margin: 0 auto;
          min-height: 200px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .preview-text {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .template-info {
          border-top: 1px solid #f0f0f0;
          padding-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default TemplatePreview; 

