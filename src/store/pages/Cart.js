import React, { useState, useEffect } from 'react';
import { Button, Input } from 'antd';
import { AiOutlineClose, AiOutlineSearch, AiOutlineDownload } from 'react-icons/ai';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { useTranslation } from 'react-i18next';
import { loadMetaPixel } from '../utils/analytics';
import { fetchPaymentByLocator } from '../../backoffice/services/apibackoffice';
import API_BASE_URL from '../../utils/apiBase';

// Move formatPrice outside the component to make it reusable
const formatPrice = (price) => {
  return typeof price === 'number' ? price.toFixed(2) : '0.00';
};

const Cart = () => {
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const { t } = useTranslation();
  const [searchLocator, setSearchLocator] = useState('');
  const { cart, clearCart, removeFromCart, setCart, functionId } = useCart();
  const [functionsInfo, setFunctionsInfo] = useState({});

  useEffect(() => {
    const pixelId = localStorage.getItem('metaPixelId');
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  useEffect(() => {
    const ids = Array.from(new Set(cart.map(i => i.funcionId).filter(Boolean)));
    if (ids.length === 0 && functionId) ids.push(functionId);
    if (!ids.length) {
      setFunctionsInfo({});
      return;
    }
    const fetchData = async () => {
      const info = {};
      await Promise.all(ids.map(async id => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/funcions/${id}`);
          if (res.ok) {
            info[id] = await res.json();
          }
        } catch (err) {
          console.error('Error fetching function details:', err);
        }
      }));
      setFunctionsInfo(info);
    };
    fetchData();
  }, [cart, functionId]);

  const handleDownloadTicket = async (locator) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${locator}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error downloading ticket');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${locator}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download ticket');
    }
  };

  const handleTicketSearch = async (locator) => {
    try {
      const data = await fetchPaymentByLocator(locator);
      if (!data) {
        throw new Error('Ticket not found');
      }
      setCart(
        data.seats.map(seat => ({
          ...seat,
          locator: data.locator,
          precio: seat.price || seat.precio || 0,
          nombreMesa: seat.mesa?.nombre || '',
          zona: seat.zona?._id || seat.zona,
          zonaNombre: seat.zona?.nombre || '',
          funcionId: data.funcion?._id || data.funcion,
          funcionFecha: data.funcion?.fechaCelebracion
        })),
        data.funcion?._id || data.funcion
      );
      toast.success('Ticket found and loaded');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveSeat = (seatId) => {
    removeFromCart(seatId);
    toast.success('Seat removed from cart');
  };

  return (
    <div className="flex flex-col w-[350px] h-screen max-h-screen bg-white shadow-md p-4 border-l border-gray-200">
      <div className="flex flex-col gap-2 mb-4 border-b pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('cart.title')}</h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 transition"
              title={t('cart.clear')}
            >
              <AiOutlineClose />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t('cart.search_placeholder')}
            value={searchLocator}
            onChange={(e) => setSearchLocator(e.target.value)}
            onPressEnter={() => handleTicketSearch(searchLocator)}
          />
          <Button
            icon={<AiOutlineSearch />}
            onClick={() => handleTicketSearch(searchLocator)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {Object.entries(cart.reduce((acc, it) => {
          const key = it.funcionId || functionId || 'default';
          if (!acc[key]) acc[key] = { fecha: it.funcionFecha, items: [] };
          acc[key].items.push(it);
          return acc;
        }, {})).map(([fid, group]) => (
          <div key={fid} className="space-y-1">
            <div className="text-xs font-medium">
              {group.fecha
                ? new Date(group.fecha).toLocaleString()
                : functionsInfo[fid]
                ? new Date(functionsInfo[fid].fechaCelebracion).toLocaleString()
                : ''}
            </div>
            {group.items.map(item => (
              <div key={item._id} className="flex justify-between items-center bg-gray-100 p-2 rounded shadow-sm text-sm">
                <div className="flex flex-col gap-1 text-xs leading-tight">
                  <span><strong>Seat:</strong> {item.nombre}</span>
                  <span><strong>Table/Row:</strong> {item.nombreMesa}</span>
                  <span><strong>Zone:</strong> {item.zonaNombre}</span>
                  <span><strong>Price:</strong> ${formatPrice(item.precio)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.locator && (
                    <button
                      title="Download ticket"
                      onClick={() => handleDownloadTicket(item.locator)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <AiOutlineDownload  />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveSeat(item._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <AiOutlineClose />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2 bg-white">
          <div className="text-right font-semibold text-lg">
            {t('cart.total')}: ${formatPrice(cart.reduce((sum, item) => sum + (item.precio || 0), 0))}
          </div>
          <Button
            type="default"
            variant="outlined"
            block
            onClick={() => {
              const path = refParam ? `/store/pay?ref=${refParam}` : '/store/pay';
              navigate(path);
            }}
          >
            {t('button.proceed_payment')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
