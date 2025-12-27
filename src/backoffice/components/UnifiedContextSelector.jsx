import React, { useState, useEffect, useMemo } from 'react';
import { message, Modal } from 'antd';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import { Calendar } from 'lucide-react';

/**
 * UnifiedContextSelector
 * 
 * A standardized selector for Recinto -> Evento -> Funcion filtering.
 * Automatically fetches data based on the current tenant.
 * Uses Premium Tailwind Design.
 * Supports 'horizontal' layout for compact views (like Boleteria).
 */
const UnifiedContextSelector = ({
    onFilterChange,
    onFunctionClick, // Callback when function selector is clicked
    // Controlled props (optional)
    venueId,
    eventId,
    functionId,
    // Configuration
    showVenue = true,
    showEvent = true,
    showFunction = true,
    // 'horizontal' for compact flex row, 'grid' (or undefined) for standard premium grid
    layout = 'grid',
    style = {}
}) => {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [showFunctionModal, setShowFunctionModal] = useState(false);

    // Data
    const [venues, setVenues] = useState([]);
    const [events, setEvents] = useState([]);
    const [functions, setFunctions] = useState([]);

    // Internal state for uncontrolled mode
    const [internalVenueId, setInternalVenueId] = useState('all');
    const [internalEventId, setInternalEventId] = useState('all');
    const [internalFunctionId, setInternalFunctionId] = useState('all');

    // Derive effective values (Controlled > Internal)
    const effectiveVenueId = venueId !== undefined ? venueId : internalVenueId;
    const effectiveEventId = eventId !== undefined ? eventId : internalEventId;
    const effectiveFunctionId = functionId !== undefined ? functionId : internalFunctionId;

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            if (!currentTenant?.id) return;
            setLoading(true);

            try {
                const isMultiTenant = currentTenant.id !== 'main-domain';

                // 1. Fetch Venues (Recintos)
                let venuesQuery = supabase.from('recintos').select('id, nombre');
                if (isMultiTenant) venuesQuery = venuesQuery.eq('tenant_id', currentTenant.id);

                // 2. Fetch Events (Eventos)
                let eventsQuery = supabase.from('eventos').select('id, nombre, recinto, recinto_id');
                if (isMultiTenant) eventsQuery = eventsQuery.eq('tenant_id', currentTenant.id);

                // 3. Fetch Functions (Funciones) - Show if sales period is still active
                const now = new Date().toISOString();
                let functionsQuery = supabase
                    .from('funciones')
                    .select('id, evento_id, fecha_celebracion, inicio_venta, fin_venta, visible_en_boleteria, visible_en_store')
                    .eq('activo', true)
                    .gte('fin_venta', now)
                    .order('fecha_celebracion', { ascending: true });


                const [venuesRes, eventsRes, functionsRes] = await Promise.all([
                    venuesQuery,
                    eventsQuery,
                    functionsQuery
                ]);

                if (venuesRes.error) throw venuesRes.error;
                if (eventsRes.error) throw eventsRes.error;
                if (functionsRes.error) throw functionsRes.error;

                setVenues(venuesRes.data || []);
                setEvents(eventsRes.data || []);
                setFunctions(functionsRes.data || []);

            } catch (error) {
                console.error('Error loading UnifiedContextSelector data:', error);
                // Solo mostrar error si no es por falta de tenant en inicialización
                if (currentTenant?.id) {
                    message.error('Error cargando filtros');
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentTenant]);

    // Derived filtered lists
    const filteredEvents = useMemo(() => {
        if (effectiveVenueId === 'all') return events;
        return events.filter(e => {
            const vId = e.recinto || e.recinto_id;
            return String(vId) === String(effectiveVenueId);
        });
    }, [events, effectiveVenueId]);

    const filteredFunctions = useMemo(() => {
        if (effectiveEventId === 'all') return functions;
        return functions.filter(f => String(f.evento_id) === String(effectiveEventId));
    }, [functions, effectiveEventId]);


    // Handlers
    const handleVenueChange = (value) => {
        if (venueId === undefined) setInternalVenueId(value);
        if (eventId === undefined) setInternalEventId('all');
        if (functionId === undefined) setInternalFunctionId('all');

        notifyChange(value, 'all', 'all');
    };

    const handleEventChange = (value) => {
        if (eventId === undefined) setInternalEventId(value);
        if (functionId === undefined) setInternalFunctionId('all');

        notifyChange(effectiveVenueId, value, 'all');
    };

    const handleFunctionChange = (value) => {
        if (functionId === undefined) setInternalFunctionId(value);

        notifyChange(effectiveVenueId, effectiveEventId, value);
    };

    const notifyChange = (vId, eId, fId) => {
        if (onFilterChange) {
            // Find objects
            const venueObj = venues.find(x => String(x.id) === String(vId));
            const eventObj = events.find(x => String(x.id) === String(eId));
            const funcObj = functions.find(x => String(x.id) === String(fId));

            onFilterChange({
                venueId: vId,
                eventId: eId,
                functionId: fId,
                objects: {
                    venue: venueObj || null,
                    event: eventObj || null,
                    function: funcObj || null
                }
            });
        }
    };

    // Helper to format function label
    const getFunctionLabel = (func) => {
        if (!func) return '';
        // Use fecha_celebracion as the primary label
        const dateStr = func.fecha_celebracion;

        if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return `${d.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })} - ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
            }
        }
        return `Función ${func.id}`;
    };

    const isCompact = layout === 'horizontal';

    // Styles configuration
    const containerClasses = isCompact
        ? "flex items-center gap-2 w-full"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    const selectClasses = isCompact
        ? "w-full text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer py-1 px-2 h-8"
        : "w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer";

    const svgSize = isCompact ? "10" : "12";
    const bgPosition = isCompact ? "right 6px center" : "right 12px center";
    const paddingRight = isCompact ? "24px" : "40px";

    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${svgSize}' height='${svgSize}' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: bgPosition,
        paddingRight: paddingRight
    };

    return (
        <div className="w-full" style={style}>
            <div className={containerClasses}>

                {/* RECINTO SELECTOR */}
                {showVenue && (
                    <div className={isCompact ? "flex-1 min-w-[120px]" : "w-full"}>
                        {!isCompact && (
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Recinto
                            </label>
                        )}
                        <select
                            value={effectiveVenueId}
                            onChange={(e) => handleVenueChange(e.target.value)}
                            disabled={loading}
                            className={selectClasses}
                            style={selectStyle}
                        >
                            <option value="all">{isCompact ? "Recinto" : "Todos los Recintos"}</option>
                            {venues.map(v => (
                                <option key={v.id} value={String(v.id)}>{v.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* EVENTO SELECTOR */}
                {showEvent && (
                    <div className={isCompact ? "flex-1 min-w-[120px]" : "w-full"}>
                        {!isCompact && (
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Evento
                            </label>
                        )}
                        <select
                            value={effectiveEventId}
                            onChange={(e) => handleEventChange(e.target.value)}
                            disabled={loading || !events.length || effectiveVenueId === 'all'}
                            className={`${selectClasses} ${(!events.length || effectiveVenueId === 'all') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                            style={selectStyle}
                        >
                            <option value="all">{isCompact ? "Evento" : "Todos los Eventos"}</option>
                            {filteredEvents.map(e => (
                                <option key={e.id} value={String(e.id)}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* FUNCIÓN BUTTON */}
                {showFunction && (
                    <div className={isCompact ? "" : "w-full"}>
                        {!isCompact && (
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                &nbsp;
                            </label>
                        )}
                        <button
                            onClick={() => {
                                if (filteredFunctions.length > 0 && effectiveEventId !== 'all') {
                                    setShowFunctionModal(true);
                                }
                            }}
                            disabled={loading || !filteredFunctions.length || effectiveEventId === 'all'}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${(!filteredFunctions.length || effectiveEventId === 'all')
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            {effectiveFunctionId && effectiveFunctionId !== 'all' ? (
                                <>
                                    {(() => {
                                        const func = filteredFunctions.find(f => String(f.id) === String(effectiveFunctionId));
                                        if (!func) return 'Seleccionar...';
                                        return new Date(func.fecha_celebracion).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        });
                                    })()}
                                </>
                            ) : (
                                'Seleccionar Función'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Function Selection Modal */}
            <Modal
                title="Seleccionar Función"
                open={showFunctionModal}
                onCancel={() => setShowFunctionModal(false)}
                footer={null}
                width={600}
                centered
            >
                <div className="space-y-2">
                    {filteredFunctions.map(func => {
                        const isSelected = String(func.id) === String(effectiveFunctionId);
                        const fecha = new Date(func.fecha_celebracion);

                        return (
                            <button
                                key={func.id}
                                onClick={() => {
                                    handleFunctionChange(String(func.id));
                                    setShowFunctionModal(false);
                                }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                {fecha.toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {fecha.toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="text-purple-600 font-semibold">
                                            ✓ Seleccionada
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
};

export default UnifiedContextSelector;
