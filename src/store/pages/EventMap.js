import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { Modal } from 'antd';
import SeatingMap from '../components/SeatingMap';
import { getCmsPage } from '../services/apistore';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import API_BASE_URL from '../../utils/apiBase';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from '@rc-component/qrcode';
import formatDateString from '../../utils/formatDateString';
import useEventData from '../hooks/useEventData';

const API_URL = API_BASE_URL;

const EventMap = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { refParam } = useRefParam();
  const { t } = useTranslation();
  const [widgets, setWidgets] = useState(null);

  const {
    evento,
    funciones,
    selectedFunctionId,
    setSelectedFunctionId,
    mapa,
    plantillaPrecios,
    carrito,
    zonas,
    pagos,
    showSeatPopup,
    setShowSeatPopup,
    discountCode,
    setDiscountCode,
    appliedDiscount,
    timeLeft,
    tagNames,
    recintoInfo,
    toggleSillaEnCarrito,
    applyDiscountCode,
    closeSeatPopup
  } = useEventData(eventId);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const funcId = params.get('funcion');
    if (funcId) {
      setSelectedFunctionId(funcId);
    }
  }, [location.search, setSelectedFunctionId]);

  const getEmbedUrl = (url) => {
    if (!url) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCmsPage('events');
        setWidgets(data.widgets);
        localStorage.setItem('cms-page-events', JSON.stringify(data.widgets));
      } catch (e) {
        const saved = localStorage.getItem('cms-page-events');
        if (saved) {
          try {
            setWidgets(JSON.parse(saved));
          } catch (err) {
            console.error('Error parsing widgets', err);
          }
        }
      }
    };
    load();
  }, []);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Listado de eventos':
        return <EventListWidget />;
      case 'Preguntas frecuentes':
        return <FaqWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      {timeLeft > 0 && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm">Tiempo restante de reserva:</p>
          <p className="text-xl font-mono">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </p>
        </div>
      )}

      {(evento?.imagenes?.portada || evento?.imagenes?.banner) && (
        <div className="relative mb-4">
          <img
            src={resolveImageUrl(
              evento?.imagenes?.portada || evento?.imagenes?.banner
            )}
            alt={`Imagen de ${evento.nombre}`}
            className="w-full max-h-[80vh] object-cover rounded"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 text-white rounded">
            {tagNames.length > 0 && (
              <span className="text-sm mb-1">
                {tagNames.join(', ')}
              </span>
            )}
            <h1 className="text-3xl font-bold">{evento?.nombre}</h1>
            {recintoInfo?.nombre ? (
              <p className="text-sm">{recintoInfo.nombre}</p>
            ) : (
              typeof evento?.recinto === 'string' && (
                <p className="text-sm">{evento.recinto}</p>
              )
            )}
          </div>
        </div>
      )}

      {evento?.descripcionHTML && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Diseño del espectáculo</h3>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
          />
          {evento.resumenDescripcion && (
            <p className="mt-2">{evento.resumenDescripcion}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Funciones</h3>
        <div className="flex flex-col gap-2">
          {funciones.map(funcion => (
            <label key={funcion.id || funcion._id} className="flex items-center gap-2">
              <input
                type="radio"
                name="funcion"
                value={funcion.id || funcion._id}
                onChange={() => setSelectedFunctionId(funcion.id || funcion._id)}
              />
              <span>{funcion.evento?.nombre} - {formatDateString(funcion.fechaCelebracion)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-2 flex gap-2 items-center">
        <input
          type="text"
          value={discountCode}
          onChange={e => setDiscountCode(e.target.value)}
          placeholder={t('discount.placeholder')}
          className="border px-2 py-1 text-sm"
        />
        <button
          onClick={applyDiscountCode}
          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
        >
          {t('discount.apply')}
        </button>
        {appliedDiscount && (
          <span className="text-sm text-green-700">{appliedDiscount.nombreCodigo}</span>
        )}
      </div>

      <div className="md:flex md:items-start md:gap-6">
        <div className="my-6 border rounded shadow-md p-4 flex justify-center bg-gray-100 md:flex-1">
          <SeatingMap mapa={mapa} zonas={zonas} onClickSilla={toggleSillaEnCarrito} />
        </div>

        <div className="bg-white p-4 rounded shadow-md mt-6 md:mt-6 md:w-80">
          <h2 className="text-xl font-semibold mb-3">Carrito</h2>
          {selectedFunctionId && (
            <div className="mb-2 font-medium">
              {(() => {
                const fn = funciones.find(f => (f.id || f._id) === selectedFunctionId);
                return fn ? formatDateString(fn.fechaCelebracion) : '';
              })()}
            </div>
          )}
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 mb-2 rounded">
            <span>{item.zonaNombre} - {item.nombreMesa} - Silla {item.nombre || index + 1} - ${item.precio}
              {item.tipoPrecio === 'descuento' && ` (${item.descuentoNombre})`}
            </span>
            <button
              onClick={() => toggleSillaEnCarrito(item)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const path = refParam ? `/store/pay?ref=${refParam}` : '/store/pay';
            navigate(path, { state: { carrito, funcionId: selectedFunctionId } });
          }}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Continuar al carrito
        </button>
        </div>
      </div>

      <Modal
        open={showSeatPopup}
        closable={false}
        maskClosable={true}
        onOk={closeSeatPopup}
        onCancel={closeSeatPopup}
        okText="Continuar"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>{evento?.otrasOpciones?.popupAntesAsiento?.texto}</p>
      </Modal>
    </div>
  );
};

export default EventMap;
