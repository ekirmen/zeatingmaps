// src/pages/Event.jsx
import React, { useEffect, useRef, useState } from 'react';
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
import EventMap from '../../components/EventMap';
import useEventData from '../hooks/useEventData';

const API_URL = API_BASE_URL;
const Event = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { refParam } = useRefParam();
  const { t } = useTranslation();
  const seatMapRef = useRef(null);
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
  } = useEventData(eventId, seatMapRef);

  console.log('Event.js - mapa:', mapa);
  console.log('Event.js - zonas:', zonas);
  console.log('Event.js - selectedFunctionId:', selectedFunctionId);

  // Allow selecting a function via query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const funcId = params.get('funcion');
    console.log('Event.js - query param funcion:', funcId);
    if (funcId) {
      setSelectedFunctionId(funcId);
    }
  }, [location.search, setSelectedFunctionId]);

  console.log('Event.js - eventId param:', eventId);

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
    if (eventId && widget.type === 'Listado de eventos') return null;
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
        <div ref={seatMapRef} className="my-6 border rounded shadow-md p-4 flex justify-center bg-gray-100 md:flex-1">
          {mapa && mapa.contenido && mapa.contenido.length > 0 ? (
            <SeatingMap mapa={mapa} zonas={zonas} onClickSilla={toggleSillaEnCarrito} />
          ) : (
            <div className="text-gray-500 italic">Mapa no disponible o vacío</div>
          )}
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

      {widgets?.content?.length
        ? widgets.content.map((w, idx) => (
            <React.Fragment key={idx}>{renderWidget(w)}</React.Fragment>
          ))
        : null}

      {evento?.videoURL && (
        <div className="mt-6">
          <iframe
            title="video"
            src={getEmbedUrl(evento.videoURL)}
            className="w-full rounded"
            height="315"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {(recintoInfo?.latitud && recintoInfo.longitud) && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">¿Cómo llegar?</h2>
          {recintoInfo.comoLlegar && (
            <p className="mb-2">{recintoInfo.comoLlegar}</p>
          )}
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <EventMap
              latitude={recintoInfo.latitud}
              longitude={recintoInfo.longitud}
              width="100%"
              height={300}
            />
            <div className="flex flex-col items-center md:w-64">
              <p className="mb-2 font-medium text-center">Escanea para llegar a tu destino.</p>
              <QRCodeSVG value={`https://www.google.com/maps?q=${recintoInfo.latitud},${recintoInfo.longitud}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Event;
