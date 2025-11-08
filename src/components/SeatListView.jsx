import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Input, Select, Space, Empty, Spin } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useFilteredSeatsWorker } from '../hooks/useSeatWorker';

const { Search } = Input;
const { Option } = Select;

/**
 * Vista de lista de asientos como alternativa al mapa para móviles
 * Usa Web Workers para filtrar y ordenar cuando hay muchos asientos
 */
const SeatListView = ({
  seats = [],
  funcionId,
  selectedSeats = [],
  onSeatToggle,
  isSeatLocked,
  isSeatLockedByMe,
  zonas = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZona, setSelectedZona] = useState(null);
  const [sortBy, setSortBy] = useState('nombre'); // nombre, precio-asc, precio-desc, zona

  // Convertir sortBy a formato del worker
  const workerSortBy = useMemo(() => {
    switch (sortBy) {
      case 'precio':
        return 'precio-asc';
      case 'precio-desc':
        return 'precio-desc';
      case 'zona':
        return 'zona-asc';
      case 'nombre':
      default:
        return 'nombre-asc';
    }
  }, [sortBy]);

  // Preparar filtros para el worker
  const filters = useMemo(() => ({
    disponible: true, // Solo mostrar disponibles
    zonaId: selectedZona || undefined,
    search: searchTerm || undefined
  }), [selectedZona, searchTerm]);

  // Usar Web Worker para filtrar y ordenar (solo si hay 50+ asientos)
  const { filteredSeats: workerFilteredSeats, loading: workerLoading } = useFilteredSeatsWorker(
    seats.length >= 50 ? seats : [],
    filters,
    workerSortBy
  );

  // Filtrar y ordenar asientos (usar worker si hay muchos, sino hacerlo localmente)
  const filteredAndSortedSeats = useMemo(() => {
    // Si hay menos de 50 asientos, procesar localmente (más rápido)
    if (seats.length < 50) {
      let filtered = [...seats];

      // Filtrar por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(seat => {
          const nombre = (seat.nombre || seat.numero || '').toLowerCase();
          const zona = (seat.nombreZona || seat.zona?.nombre || '').toLowerCase();
          return nombre.includes(term) || zona.includes(term);
        });
      }

      // Filtrar por zona
      if (selectedZona) {
        filtered = filtered.filter(seat => {
          const zonaId = seat.zonaId || seat.zona?.id;
          return zonaId === selectedZona;
        });
      }

      // Filtrar disponibles
      filtered = filtered.filter(seat => {
        const seatId = seat._id || seat.id || seat.sillaId;
        const locked = isSeatLocked ? isSeatLocked(seatId, funcionId) : false;
        const isSelected = selectedSeats.includes(seatId);
        return !seat.vendido && !seat.reservado && (seat.disponible !== false) && (!locked || isSelected);
      });

      // Ordenar
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'precio':
            return (a.precio || 0) - (b.precio || 0);
          case 'precio-desc':
            return (b.precio || 0) - (a.precio || 0);
          case 'zona':
            const zonaA = (a.nombreZona || a.zona?.nombre || '').toLowerCase();
            const zonaB = (b.nombreZona || b.zona?.nombre || '').toLowerCase();
            return zonaA.localeCompare(zonaB);
          case 'nombre':
          default:
            const nombreA = (a.nombre || a.numero || '').toLowerCase();
            const nombreB = (b.nombre || b.numero || '').toLowerCase();
            return nombreA.localeCompare(nombreB);
        }
      });

      return filtered;
    }

    // Si hay 50+ asientos, usar resultado del worker
    // Aplicar filtros adicionales que el worker no puede hacer (estado de locks)
    if (workerFilteredSeats && workerFilteredSeats.length > 0) {
      return workerFilteredSeats.filter(seat => {
        const seatId = seat._id || seat.id || seat.sillaId;
        const locked = isSeatLocked ? isSeatLocked(seatId, funcionId) : false;
        const isSelected = selectedSeats.includes(seatId);
        // Si está bloqueado pero no por mí y no está seleccionado, no mostrarlo
        if (locked && !isSelected) {
          return false;
        }
        return true;
      });
    }

    return [];
  }, [seats, searchTerm, selectedZona, sortBy, workerFilteredSeats, workerLoading, isSeatLocked, funcionId, selectedSeats]);

  const handleSeatClick = async (seat) => {
    if (onSeatToggle) {
      await onSeatToggle(seat);
    }
  };

  const getSeatStatus = (seat) => {
    const seatId = seat._id || seat.id || seat.sillaId;
    const isSelected = selectedSeats.includes(seatId);
    const locked = isSeatLocked ? isSeatLocked(seatId, funcionId) : false;
    const lockedByMe = isSeatLockedByMe ? isSeatLockedByMe(seatId, funcionId) : false;

    if (isSelected || lockedByMe) {
      return { status: 'selected', text: 'Seleccionado', color: 'success' };
    }
    if (locked) {
      return { status: 'locked', text: 'Ocupado', color: 'default' };
    }
    if (seat.estado === 'vendido' || seat.estado === 'pagado') {
      return { status: 'sold', text: 'Vendido', color: 'error' };
    }
    return { status: 'available', text: 'Disponible', color: 'processing' };
  };

  return (
    <div className="seat-list-view h-full flex flex-col">
      {/* Filtros y búsqueda */}
      <div className="p-4 bg-white border-b space-y-3">
        {workerLoading && seats.length >= 50 && (
          <div className="flex items-center justify-center py-2">
            <Spin size="small" /> <span className="ml-2 text-sm text-gray-500">Procesando asientos...</span>
          </div>
        )}
        <Search
          placeholder="Buscar asiento por nombre o zona..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
        
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="Filtrar por zona"
            value={selectedZona}
            onChange={setSelectedZona}
            allowClear
            style={{ flex: 1, minWidth: 150 }}
            prefixIcon={<FilterOutlined />}
          >
            {zonas.map(zona => (
              <Option key={zona.id || zona._id} value={zona.id || zona._id}>
                {zona.nombre}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Ordenar por"
            value={sortBy}
            onChange={setSortBy}
            style={{ flex: 1, minWidth: 150 }}
          >
            <Option value="nombre">Nombre</Option>
            <Option value="precio">Precio</Option>
            <Option value="zona">Zona</Option>
          </Select>
        </div>
      </div>

      {/* Lista de asientos */}
      <div className="flex-1 overflow-auto p-4">
        {filteredAndSortedSeats.length === 0 ? (
          <Empty 
            description="No se encontraron asientos"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSortedSeats.map((seat) => {
              const seatId = seat._id || seat.id || seat.sillaId;
              const seatStatus = getSeatStatus(seat);
              const precio = seat.precio || 0;
              const nombreZona = seat.nombreZona || seat.zona?.nombre || 'General';
              const nombreAsiento = seat.nombre || seat.numero || `Asiento ${seatId}`;

              return (
                <Card
                  key={seatId}
                  hoverable
                  onClick={() => handleSeatClick(seat)}
                  className={`seat-card cursor-pointer transition-all ${
                    seatStatus.status === 'selected' 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : ''
                  } ${
                    seatStatus.status === 'locked' || seatStatus.status === 'sold'
                      ? 'opacity-60 cursor-not-allowed'
                      : ''
                  }`}
                  size="small"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{nombreAsiento}</div>
                      <div className="text-sm text-gray-500">{nombreZona}</div>
                    </div>
                    <Badge 
                      status={seatStatus.color} 
                      text={seatStatus.text}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-bold text-blue-600">
                      ${precio.toFixed(2)}
                    </span>
                    <Button
                      type={seatStatus.status === 'selected' ? 'primary' : 'default'}
                      size="small"
                      disabled={seatStatus.status === 'locked' || seatStatus.status === 'sold'}
                    >
                      {seatStatus.status === 'selected' ? 'Quitar' : 'Seleccionar'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="p-4 bg-white border-t">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {filteredAndSortedSeats.length} asiento{filteredAndSortedSeats.length !== 1 ? 's' : ''} 
            {selectedSeats.length > 0 && ` • ${selectedSeats.length} seleccionado${selectedSeats.length !== 1 ? 's' : ''}`}
          </span>
          {selectedSeats.length > 0 && (
            <span className="font-bold text-lg">
              Total: ${selectedSeats.reduce((sum, seatId) => {
                const seat = seats.find(s => (s._id || s.id || s.sillaId) === seatId);
                return sum + (seat?.precio || 0);
              }, 0).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatListView;

