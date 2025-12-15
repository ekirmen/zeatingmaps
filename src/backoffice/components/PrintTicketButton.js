import React, { useState } from 'react';
import { Button, Modal, message, Alert, Space, Typography } from '../../utils/antdComponents';
import { PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { bocaPrinterService, getFormatConfig } from '../services/bocaPrinterService';

const { Title, Text } = Typography;

const PrintTicketButton = ({ ticketData, onPrintComplete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [formatConfig, setFormatConfig] = useState(null);

  const handlePrint = async () => {
    try {
      setPrinting(true);

      // Cargar configuraci³n de formato
      const config = await getFormatConfig();
      setFormatConfig(config);

      // Verificar conexi³n de impresora
      const status = await bocaPrinterService.getPrinterStatus();
      setPrinterStatus(status);

      if (!status.connected) {
        return;
      }

      // Imprimir ticket
      const success = await bocaPrinterService.printTicket(ticketData, config);

      if (success) {
        message.success('Ticket impreso exitosamente');
        setIsModalVisible(false);
        if (onPrintComplete) {
          onPrintComplete();
        }
      } else {
        message.error('Error al imprimir el ticket');
      }
    } catch (error) {
      console.error('Error printing ticket:', error);
      message.error('Error al imprimir el ticket');
    } finally {
      setPrinting(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Button type="primary" icon={<PrinterOutlined />} onClick={showModal} size="large">
        Imprimir con Boca
      </Button>

      <Modal
        title={
          <Space>
            <PrinterOutlined />
            <span>Imprimir Ticket</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handlePrint}
        onCancel={handleCancel}
        confirmLoading={printing}
        okText="Imprimir"
        cancelText="Cancelar"
        width={600}
      >
        <div className="print-ticket-modal">
          <Alert
            message="Confirmaci³n de Impresi³n"
            description="Se imprimir¡ el ticket en la impresora Boca conectada. Asegºrate de que la impresora est© encendida y tenga papel."
            type="info"
            showIcon
            className="mb-4"
          />

          {printerStatus && (
            <div className="mb-4">
              <Title level={5}>Estado de la Impresora:</Title>
              <Space>
                <Text>
                  <CheckCircleOutlined
                    style={{ color: printerStatus.connected ? '#52c41a' : '#ff4d4f' }}
                  />
                  {printerStatus.connected ? ' Conectada' : ' Desconectada'}
                </Text>
                <Text>
                  <CheckCircleOutlined
                    style={{ color: printerStatus.ready ? '#52c41a' : '#ff4d4f' }}
                  />
                  {printerStatus.ready ? ' Lista' : ' No Lista'}
                </Text>
                <Text>
                  <CheckCircleOutlined
                    style={{ color: printerStatus.paperStatus === 'OK' ? '#52c41a' : '#ff4d4f' }}
                  />
                  Papel: {printerStatus.paperStatus}
                </Text>
              </Space>
            </div>
          )}

          {ticketData && (
            <div className="mb-4">
              <Title level={5}>Datos del Ticket:</Title>
              <div className="ticket-preview">
                <div className="ticket-info">
                  <Text strong>Evento:</Text> {ticketData.eventName}
                </div>
                <div className="ticket-info">
                  <Text strong>Fecha:</Text> {ticketData.eventDate}
                </div>
                <div className="ticket-info">
                  <Text strong>Hora:</Text> {ticketData.eventTime}
                </div>
                <div className="ticket-info">
                  <Text strong>Asiento:</Text> {ticketData.seatNumber}
                </div>
                <div className="ticket-info">
                  <Text strong>Zona:</Text> {ticketData.zoneName}
                </div>
                <div className="ticket-info">
                  <Text strong>Precio:</Text> ${ticketData.price}
                </div>
                <div className="ticket-info">
                  <Text strong>Ticket #:</Text> {ticketData.ticketNumber}
                </div>
              </div>
            </div>
          )}

          {formatConfig && (
            <div className="mb-4">
              <Title level={5}>Configuraci³n de Formato:</Title>
              <div className="format-info">
                <Text>
                  Papel: {formatConfig.paperWidth}mm x {formatConfig.paperHeight}mm
                </Text>
                <br />
                <Text>Fuente: {formatConfig.fontSize === '00' ? 'Normal' : 'Doble'}</Text>
                <br />
                <Text>Alineaci³n: {formatConfig.alignment === '1' ? 'Centro' : 'Izquierda'}</Text>
              </div>
            </div>
          )}

          <Alert
            message="Nota Importante"
            description="Si la impresora no responde, verifica que est© conectada y encendida. Puedes configurar la impresora en la secci³n 'Impresora Boca' del menº."
            type="warning"
            showIcon
          />
        </div>
      </Modal>
    </>
  );
};

export default PrintTicketButton;
