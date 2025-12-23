import React, { useState, useEffect, useMemo } from 'react';
import { Select, Space, Spin, message } from 'antd'; // Assuming antdComponents wrapper or direct import
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Option } = Select;

/**
 * UnifiedContextSelector
 * 
 * A standardized selector for Recinto -> Evento -> Funcion filtering.
 * Automatically fetches data based on the current tenant.
 * 
 * Props:
 * @param {Function} onFilterChange - Callback function returning ({ venueId, eventId, functionId, objects: {venue, event, function} })
 * @param {Object} initialValues - { venueId, eventId, functionId }
 * @param {boolean} showVenue - Whether to show the Venue (Recinto) selector
 * @param {boolean} showEvent - Whether to show the Event selector
 * @param {boolean} showFunction - Whether to show the Function selector
 * @param {string} layout - 'horizontal' or 'vertical'
 * @param {Object} style - Container style
 */
const UnifiedContextSelector = ({
    onFilterChange,
    // Controlled props (optional)
    venueId,
    eventId,
    functionId,
    // Configuration
    showVenue = true,
    showEvent = true,
    showFunction = true,
    layout = 'horizontal',
    style = {}
}) => {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);

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
                let venuesQuery = supabase.from('recintos').select('id, nombre, tenant_id');
                if (isMultiTenant) venuesQuery = venuesQuery.eq('tenant_id', currentTenant.id);

                // 2. Fetch Events (Eventos)
                let eventsQuery = supabase.from('eventos').select('id, nombre, recinto, recinto_id, tenant_id');
                if (isMultiTenant) eventsQuery = eventsQuery.eq('tenant_id', currentTenant.id);

                // 3. Fetch Functions (Funciones)
                let functionsQuery = supabase.from('funciones').select('id, nombre, evento_id, fecha_celebracion, fecha, hora, tenant_id');
                if (isMultiTenant) functionsQuery = functionsQuery.eq('tenant_id', currentTenant.id);

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
                message.error('Error cargando filtros');
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
        const name = func.nombre || `Función ${func.id}`;
        const date = func.fecha || func.fecha_celebracion;
        const time = func.hora;

        let label = name;
        if (date) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                label += ` - ${d.toLocaleDateString()}`;
            }
        }
        if (time) label += ` ${time}`;
        return label;
    };

    return (
        <div style={style}>
            <Space direction={layout} size="small" wrap>

                {/* RECINTO SELECTOR */}
                {showVenue && (
                    <Select
                        placeholder="Seleccionar Recinto"
                        style={{ width: 220 }}
                        value={effectiveVenueId}
                        onChange={handleVenueChange}
                        loading={loading}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Todos los Recintos</Option>
                        {venues.map(v => (
                            <Option key={v.id} value={String(v.id)}>{v.nombre}</Option>
                        ))}
                    </Select>
                )}

                {/* EVENTO SELECTOR */}
                {showEvent && (
                    <Select
                        placeholder="Seleccionar Evento"
                        style={{ width: 220 }}
                        value={effectiveEventId}
                        onChange={handleEventChange}
                        loading={loading}
                        disabled={!events.length}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Todos los Eventos</Option>
                        {filteredEvents.map(e => (
                            <Option key={e.id} value={String(e.id)}>{e.nombre}</Option>
                        ))}
                    </Select>
                )}

                {/* FUNCION SELECTOR */}
                {showFunction && (
                    <Select
                        placeholder="Seleccionar Función"
                        style={{ width: 220 }}
                        value={effectiveFunctionId}
                        onChange={handleFunctionChange}
                        loading={loading}
                        disabled={!functions.length}
                        showSearch
                        optionFilterProp="children"
                    >
                        <Option value="all">Todas las Funciones</Option>
                        {filteredFunctions.map(f => (
                            <Option key={f.id} value={String(f.id)}>{getFunctionLabel(f)}</Option>
                        ))}
                    </Select>
                )}
            </Space>
        </div>
    );
};

export default UnifiedContextSelector;
