import { useEffect, useState, useRef, useCallback } from 'react';
import { useCart } from '../../contexts/CartContext';
import { fetchMapa, fetchPlantillaPrecios, getFunciones, getMapaPorEvento } from '../services/apistore';
import { fetchZonasPorSala } from '../../services/supabaseServices';
import { fetchSeatsByFuncion, createOrUpdateSeat } from '../../backoffice/services/supabaseSeats';
import { lockSeat, unlockSeat } from '../../backoffice/services/seatLocks';
import { supabase } from '../../supabaseClient';
import { fetchPayments } from '../../backoffice/services/apibackoffice';
import { loadGtm, loadMetaPixel } from '../utils/analytics';
import { isUuid, isNumericId } from '../../utils/isUuid';
import getZonaColor from '../../utils/getZonaColor';
import API_BASE_URL from '../../utils/apiBase';
import { useSeatRealtime } from './useSeatRealtime';
import useFirebaseSeatLocks from './useFirebaseSeatLocks';

// --- Importaciones de Firebase corregidas ---
import { ref, runTransaction } from 'firebase/database'; // ref y runTransaction son funciones
import { getDatabaseInstance, isFirebaseEnabled, getAuthInstance } from '../../services/firebaseClient';
import { signInAnonymously } from 'firebase/auth'; // Solo necesitamos signInAnonymously de este paquete

const API_URL = API_BASE_URL;

const normalizeId = (obj) => ({ ...obj, id: obj.id || obj._id });

const LOCAL_STORAGE_CART_PREFIX = 'cart';
const LOCAL_STORAGE_SEAT_POPUP_PREFIX = 'seat-popup';

const useEventData = (eventId, seatMapRef) => {
    const [evento, setEvento] = useState(null);
    const [funciones, setFunciones] = useState([]);
    const [selectedFunctionId, setSelectedFunctionId] = useState(null);
    const [mapa, setMapa] = useState(null);
    const [plantillaPrecios, setPlantillaPrecios] = useState(null);
    const [zonas, setZonas] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [recintoInfo, setRecintoInfo] = useState(null);
    const [tagNames] = useState([]);
    const [showSeatPopup, setShowSeatPopup] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [timeLeft, setTimeLeft] = useState(() => {
        const savedTime = localStorage.getItem(`timer-${eventId}-${selectedFunctionId || 'none'}`);
        return savedTime ? parseInt(savedTime, 10) : 0;
    });
    const [firebaseEnabled, setFirebaseEnabled] = useState(false);

    const { cart, setCart, duration } = useCart();
    const [carrito, setCarrito] = useState([]);
    const cartRef = useRef([]);
    const timerRef = useRef(null);

    // Compose localStorage keys for cart and seat popup
    const localStorageCartKey = `${LOCAL_STORAGE_CART_PREFIX}-${eventId}-${selectedFunctionId || 'none'}`;
    const localStorageSeatPopupKey = `${LOCAL_STORAGE_SEAT_POPUP_PREFIX}-${evento?.id || eventId}`;

    // Load cart from localStorage on mount or when eventId or selectedFunctionId changes
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(localStorageCartKey);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setCarrito(parsedCart);
                setCart(parsedCart, selectedFunctionId);
            } else {
                setCarrito([]);
                setCart([], selectedFunctionId);
            }
        } catch (e) {
            console.error('Error loading cart from localStorage', e);
            setCarrito([]);
            setCart([], selectedFunctionId);
        }
    }, [localStorageCartKey, setCart, selectedFunctionId]);

    // Save cart to localStorage whenever carrito changes
    useEffect(() => {
        try {
            // Ensure zonaNombre is present in each cart item before saving
            const carritoWithZonaNombre = carrito.map(item => ({
                ...item,
                zonaNombre: item.zonaNombre || (item.zona ? zonas.find(z => z.id === item.zona || z._id === item.zona)?.nombre : '') || ''
            }));
            localStorage.setItem(localStorageCartKey, JSON.stringify(carritoWithZonaNombre));
        } catch (e) {
            console.error('Error saving cart to localStorage', e);
        }
    }, [carrito, localStorageCartKey, zonas]);

    const closeSeatPopup = () => {
        setShowSeatPopup(false);
        try {
            localStorage.setItem(localStorageSeatPopupKey, '1');
        } catch (e) {
            console.error('Error saving popup state', e);
        }
    };

    const loadEvento = useCallback(async () => {
        try {
            const query = supabase.from('eventos').select('*');
            const { data, error } = await (
                isUuid(eventId)
                    ? query.eq('id', eventId)
                    : isNumericId(eventId)
                        ? query.eq('id', parseInt(eventId, 10))
                        : query.ilike('slug', eventId)
            ).maybeSingle();

            if (error) throw error;
            const evt = normalizeId(data);
            setEvento(evt);

            if (evt.recinto) {
                const { data: recinto, error: recintoError } = await supabase
                    .from('recintos').select('*').eq('id', evt.recinto).maybeSingle();
                if (!recintoError) setRecintoInfo(recinto);
            }

            if (evt.otrasOpciones?.popupAntesAsiento?.mostrar) {
                if (!localStorage.getItem(localStorageSeatPopupKey)) {
                    setShowSeatPopup(true);
                }
            }

            if (evt.analytics?.enabled) {
                const { gtmId, metaPixelId } = evt.analytics;
                loadGtm(gtmId);
                loadMetaPixel(metaPixelId);
                if (metaPixelId) localStorage.setItem('metaPixelId', metaPixelId);
                if (gtmId) localStorage.setItem('gtmId', gtmId);
            }
        } catch (err) {
            console.error('Error fetching event', err);
        }
    }, [eventId, localStorageSeatPopupKey]);

    const loadFunciones = useCallback(async () => {
        const id = evento?.id || (isUuid(eventId) ? eventId : parseInt(eventId));
        if (!id) return;
        try {
            const data = await getFunciones(id);
            const normalizadas = (data || []).map(normalizeId);
            setFunciones(normalizadas);
            if (normalizadas.length === 1) setSelectedFunctionId(normalizadas[0].id);
        } catch (err) {
            console.error('Error loading funciones', err);
        }
    }, [evento, eventId]);

    const loadZonas = useCallback(async () => {
        try {
            const zonasMap = new Map();
            for (const funcion of funciones) {
                const detalles = funcion?.plantilla?.detalles || [];
                detalles.forEach(d => {
                    if (d.zonaId) zonasMap.set(d.zonaId, { id: d.zonaId, nombre: d.nombre || d.zonaNombre || '', color: d.color });
                });

                const salaId = typeof funcion.sala === 'object' ? funcion.sala.id || funcion.sala._id : funcion.sala;
                if (salaId) {
                    const zonasSala = await fetchZonasPorSala(salaId);
                    zonasSala.forEach(z => zonasMap.set(z.id || z._id, { id: z.id || z._id, nombre: z.nombre, color: z.color }));
                }
            }
            setZonas([...zonasMap.values()]);
        } catch (err) {
            console.error('Error loading zonas', err);
        }
    }, [funciones]);

    const mapaLoadedForFunctionId = useRef(null);

    const loadMapaYSeats = useCallback(async () => {
        if (mapaLoadedForFunctionId.current === selectedFunctionId) {
            // Prevent repeated loading if already loaded for this function
            return;
        }
        console.log('loadMapaYSeats: funciones:', funciones);
        console.log('loadMapaYSeats: selectedFunctionId:', selectedFunctionId, 'type:', typeof selectedFunctionId);
        const funcion = funciones.find(f => String(f.id) === String(selectedFunctionId));
        if (!funcion) {
            console.warn('loadMapaYSeats: funcion not found for selectedFunctionId:', selectedFunctionId);
            return;
        }

        try {
            const salaId = typeof funcion.sala === 'object' ? funcion.sala.id || funcion.sala._id : funcion.sala;
            console.log('loadMapaYSeats: salaId:', salaId);
            const [mapaSala, seatStates] = await Promise.all([
                fetchMapa(salaId),
                fetchSeatsByFuncion(selectedFunctionId),
            ]);
            console.log('loadMapaYSeats: mapaSala:', mapaSala);

            const mapaData = mapaSala || await getMapaPorEvento(evento?.id || funcion.evento);
            const seatMap = Object.fromEntries(seatStates.map(s => [s._id || s.id, s.bloqueado ? 'bloqueado' : s.status]));
            const selectedIds = carrito.map(c => c._id);

            const actualizado = {
                ...mapaData,
                contenido: mapaData.contenido.map(elemento => ({
                    ...elemento,
                    sillas: elemento.sillas.map(s => {
                        const zonaId = s.zona || elemento.zona;
                        const baseColor = getZonaColor(zonaId) || 'lightblue';
                        const estado = seatMap[s._id] || 'disponible';
                        const isSelected = selectedIds.includes(s._id);
                        const color = estado === 'reservado' ? 'red' : estado === 'pagado' ? 'gray' : estado === 'bloqueado' ? 'orange' : baseColor;
                        return { ...s, estado, color, selected: isSelected };
                    })
                }))
            };

            setMapa(actualizado);
            mapaLoadedForFunctionId.current = selectedFunctionId;

            if (funcion.plantilla?.id || funcion.plantilla?._id) {
                const plantilla = await fetchPlantillaPrecios(funcion.plantilla.id || funcion.plantilla._id);
                setPlantillaPrecios(plantilla);
            }
        } catch (err) {
            console.error('Error loading mapa/seats', err);
        }
    }, [selectedFunctionId, funciones, evento, carrito]);

    const startTimer = useCallback(() => {
        if (timerRef.current) {
            console.log('startTimer: timer already running, skipping restart');
            return;
        }
        console.log('startTimer: starting timer');
        setTimeLeft(duration ? duration * 60 : 900);
        localStorage.setItem(`timer-${eventId}-${selectedFunctionId || 'none'}`, String(duration ? duration * 60 : 900));
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setCarrito([]);
                    localStorage.removeItem(`timer-${eventId}-${selectedFunctionId || 'none'}`);
                    return 0;
                }
                const newTime = prev - 1;
                localStorage.setItem(`timer-${eventId}-${selectedFunctionId || 'none'}`, String(newTime));
                return newTime;
            });
        }, 1000);
    }, [duration, eventId, selectedFunctionId]);


    const applyDiscountCode = async () => {
        if (!discountCode.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/descuentos/code/${encodeURIComponent(discountCode.trim())}`);
            if (!res.ok) throw new Error('Código no válido');
            const data = await res.json();
            const now = Date.now();
            if (data.fechaInicio && new Date(data.fechaInicio).getTime() > now) throw new Error('Descuento no disponible aún');
            if (data.fechaFinal && new Date(data.fechaFinal).getTime() < now) throw new Error('Descuento expirado');
            setAppliedDiscount(data);
        } catch (err) {
            console.error('Error al aplicar descuento:', err);
            setAppliedDiscount(null);
        }
    };

    // --- Función toggleSillaEnCarrito MODIFICADA para usar transacciones de Firebase ---
    const toggleSillaEnCarrito = useCallback(async (silla, mesa) => {
        const zonaId = silla?.zona || mesa?.zona;
        // Impedir acción si el asiento ya está en un estado final (reservado, pagado) o bloqueado por otra causa
        if (!zonaId || ['reservado', 'pagado'].includes(silla?.estado) || silla?.bloqueado) {
            console.log(`Asiento ${silla._id} no disponible para acción. Estado: ${silla?.estado}, Bloqueado: ${silla?.bloqueado}`);
            return;
        }

        const index = carrito.findIndex(item => item._id === silla._id);
        const isAdding = index === -1; // true si estamos añadiendo, false si estamos quitando

        const basePrice = plantillaPrecios?.detalles.find(p => p.zonaId === zonaId)?.precio || 100;
        const zonaNombre = zonas.find(z => z.id === zonaId)?.nombre || 'Zona';
        let finalPrice = basePrice;
        let tipoPrecio = 'normal';
        let descuentoNombre = '';

        if (appliedDiscount?.detalles) {
            const detalle = appliedDiscount.detalles.find(d => d.zona === silla?.zona);
            if (detalle) {
                finalPrice = detalle.tipo === 'porcentaje'
                    ? basePrice * (1 - detalle.valor / 100)
                    : basePrice - detalle.valor;
                tipoPrecio = 'descuento';
                descuentoNombre = appliedDiscount.nombreCodigo;
            }
        }

        // Datos del asiento a agregar/quitar para el carrito
        const seatItemData = {
            ...silla,
            zona: zonaId,
            precio: finalPrice,
            nombreMesa: mesa?.nombre,
            zonaNombre,
            tipoPrecio,
            descuentoNombre
        };

        let newCarritoState;
        let dbOperationSuccess = false; //
        // Firebase transaction logic for seat locking
        if (firebaseEnabled) {
            try {
                const db = getDatabaseInstance();
                const seatRef = ref(db, `seats/${selectedFunctionId}/${silla._id}`);
                
                const result = await runTransaction(seatRef, (currentData) => {
                    if (currentData === null || currentData.status === 'available') {
                        return isAdding ? { status: 'locked', timestamp: Date.now() } : null;
                    }
                    // Don't update if seat is already locked by someone else
                    return;
                });

                if (!result.committed) {
                    console.log('Transaction failed - seat may be locked by another user');
                    return;
                }
                dbOperationSuccess = true;
            } catch (error) {
                console.error('Firebase transaction error:', error);
                return;
            }
        } else {
            // Fallback to traditional locking mechanism
            try {
                if (isAdding) {
                    await lockSeat(silla._id, selectedFunctionId);
                } else {
                    await unlockSeat(silla._id, selectedFunctionId);
                }
                dbOperationSuccess = true;
            } catch (error) {
                console.error('Seat lock/unlock error:', error);
                return;
            }
        }

        // Only update cart if DB operation succeeded
        if (dbOperationSuccess) {
            newCarritoState = isAdding 
                ? [...carrito, seatItemData]
                : carrito.filter(item => item._id !== silla._id);
            
            setCarrito(newCarritoState);
            setCart(newCarritoState, selectedFunctionId);

            if (isAdding && !timerRef.current) {
                startTimer();
            }
        }
        // Update UI state if cart is empty
        if (newCarritoState?.length === 0) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setTimeLeft(0);
            localStorage.removeItem(`timer-${eventId}-${selectedFunctionId || 'none'}`);
        }

        // Update seat status in database
        try {
            await createOrUpdateSeat({
                id: silla._id,
                funcion: selectedFunctionId,
                status: isAdding ? 'reservado' : 'disponible',
                bloqueado: isAdding
            });
        } catch (error) {
            console.error('Error updating seat status:', error);
        }
    }, [carrito, plantillaPrecios, zonas, appliedDiscount, selectedFunctionId, setCart, startTimer, eventId, firebaseEnabled]);
    const loadPagos = useCallback(async () => {
        try {
            const data = await fetchPayments(eventId);
            setPagos(data || []);
        } catch (err) {
            console.error('Error loading payments', err);
        }
    }, [eventId]);

    // Initialize Firebase auth and check if enabled
    useEffect(() => {
        const initFirebase = async () => {
            const enabled = await isFirebaseEnabled();
            setFirebaseEnabled(enabled);
            if (enabled) {
                try {
                    const auth = getAuthInstance();
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error('Firebase auth error:', error);
                }
            }
        };
        initFirebase();
    }, []);

    // Load initial event data
    useEffect(() => {
        loadEvento();
    }, [loadEvento]);

    // Load functions when event changes
    useEffect(() => {
        if (evento) loadFunciones();
    }, [evento, loadFunciones]);

    // Load zones when functions change
    useEffect(() => {
        if (funciones.length) loadZonas();
    }, [funciones, loadZonas]);

    // Load map and seats when function is selected
    useEffect(() => {
        if (selectedFunctionId) loadMapaYSeats();
    }, [selectedFunctionId, loadMapaYSeats]);

    // Load payments periodically
    useEffect(() => {
        loadPagos();
        const interval = setInterval(loadPagos, 30000);
        return () => clearInterval(interval);
    }, [loadPagos]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    // Use real-time seat updates
    useSeatRealtime(selectedFunctionId, setMapa);
    useFirebaseSeatLocks(selectedFunctionId);

    return {
        evento,
        funciones,
        selectedFunctionId,
        setSelectedFunctionId,
        mapa,
        plantillaPrecios,
        zonas,
        pagos,
        recintoInfo,
        tagNames,
        showSeatPopup,
        closeSeatPopup,
        carrito,
        timeLeft,
        discountCode,
        setDiscountCode,
        appliedDiscount,
        applyDiscountCode,
        toggleSillaEnCarrito
    };
};

export default useEventData;
