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
import { useFirebaseSeatLocks } from './useFirebaseSeatLocks';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, runTransaction, set } from 'firebase/database';
import { db, isFirebaseEnabled, auth } from '../../services/firebaseClient';
import { signInAnonymously } from 'firebase/auth';

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
    const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const { cart, setCart, duration } = useCart();
    const [carrito, setCarrito] = useState([]);
    const cartRef = useRef([]);
    const timerRef = useRef(null);

    const localStorageCartKey = `${LOCAL_STORAGE_CART_PREFIX}-${eventId}-${selectedFunctionId || 'none'}`;
    const localStorageSeatPopupKey = `${LOCAL_STORAGE_SEAT_POPUP_PREFIX}-${evento?.id || eventId}`;

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

    useEffect(() => {
        try {
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
            return;
        }
        const funcion = funciones.find(f => String(f.id) === String(selectedFunctionId));
        if (!funcion) {
            console.warn('loadMapaYSeats: funcion not found for selectedFunctionId:', selectedFunctionId);
            return;
        }

        try {
            const salaId = typeof funcion.sala === 'object' ? funcion.sala.id || funcion.sala._id : funcion.sala;
            const [mapaSala, seatStates] = await Promise.all([
                fetchMapa(salaId),
                fetchSeatsByFuncion(selectedFunctionId),
            ]);

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
            return;
        }
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

    const toggleSillaEnCarrito = useCallback(async (silla, mesa) => {
        const zonaId = silla?.zona || mesa?.zona;
        if (!zonaId || ['reservado', 'pagado'].includes(silla?.estado) || silla?.bloqueado) {
            return;
        }

        const index = carrito.findIndex(item => item._id === silla._id);
        const isAdding = index === -1;
        const normalizedSeatId = silla._id || silla.id;
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
        let dbOperationSuccess = false;

        const databaseInstance = await db;
        const authInstanceResolved = await auth;

        if (!databaseInstance) {
            console.error("Firebase Database no está inicializado o habilitado. No se puede realizar la operación.");
            alert("Hubo un problema con la conexión a la base de datos. Por favor, recarga la página.");
            return;
        }

        if (!authInstanceResolved) {
            console.error("Firebase Auth no está inicializado o habilitado. No se puede obtener el ID de usuario.");
            alert("Hubo un problema con la autenticación. Por favor, recarga la página.");
            return;
        }

        if (!isAuthReady) {
            console.warn("Firebase Auth no está listo aún. No se puede proceder con la selección de asiento.");
            alert("La sesión no está lista. Por favor, espera un momento y vuelve a intentarlo.");
            return;
        }

        if (!authInstanceResolved.currentUser) {
            try {
                const userCredential = await signInAnonymously(authInstanceResolved);
                setCurrentUserId(userCredential.user.uid);
            } catch (error) {
                console.error("Error al iniciar sesión anónimamente para carrito:", error);
                alert("No pudimos preparar tu sesión para modificar el carrito. Por favor, intenta de nuevo.");
                return;
            }
        }

        if (isAdding) {
            if (!firebaseEnabled) {
                try {
                    await Promise.all([
                        createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'bloqueado' }),
                        lockSeat(silla._id, 'bloqueado', selectedFunctionId, { seatDetails: seatItemData })
                    ]);
                    dbOperationSuccess = true;
                } catch (err) {
                    console.error('Error al bloquear asiento en Supabase (Firebase deshabilitado):', err);
                    alert('Lo siento, el asiento ya no está disponible. Por favor, intenta de nuevo.');
                }
            } else {
                const seatRef = ref(databaseInstance, `seats/${selectedFunctionId}/${silla._id}`);
                let userId = currentUserId;
                const forzarRegistro = evento?.otrasOpciones?.registroObligatorioAntesSeleccion ?? false;

                if (!userId) {
                    if (forzarRegistro) {
                        alert("Debes iniciar sesión o registrarte para seleccionar un asiento.");
                        return;
                    } else {
                        try {
                            const userCredential = await signInAnonymously(authInstanceResolved);
                            userId = userCredential.user.uid;
                            setCurrentUserId(userId);
                        } catch (error) {
                            console.error("Error al iniciar sesión anónimamente:", error.code, error.message);
                            alert("No pudimos preparar tu sesión para seleccionar asientos. Por favor, intenta de nuevo.");
                            return;
                        }
                    }
                }

                if (!userId) {
                    alert("Hubo un problema con tu sesión. Por favor, recarga la página e intenta de nuevo.");
                    return;
                }

                try {
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        if (currentSeatData === null || currentSeatData.status === "available") {
                            return {
                                status: "occupied",
                                reservedBy: userId,
                                timestamp: Date.now(),
                                seatDetails: seatItemData
                            };
                        } else {
                            return undefined;
                        }
                    });

                    if (committed) {
                        const cartSeatRef = ref(databaseInstance, `in-cart/${userId}/${silla._id}`);
                        await set(cartSeatRef, seatItemData);
                        dbOperationSuccess = true;
                    } else {
                        alert('Lo siento, el asiento acaba de ser tomado por otra persona. Por favor, elige otro.');
                    }
                } catch (error) {
                    console.error(`Error en transacción de Firebase para asiento ${silla._id}:`, error);
                    alert('Hubo un error al intentar seleccionar el asiento. Por favor, inténtalo de nuevo.');
                }
            }

            if (dbOperationSuccess) {
                newCarritoState = [...carrito, seatItemData];
            } else {
                newCarritoState = carrito;
            }

        } else {
            newCarritoState = carrito.filter(item => item._id !== silla._id);
            const userId = currentUserId;

            if (firebaseEnabled && userId) {
                const seatRef = ref(databaseInstance, `seats/${selectedFunctionId}/${silla._id}`);
                const cartSeatRef = ref(databaseInstance, `in-cart/${userId}/${silla._id}`);

                try {
                    await set(cartSeatRef, null);
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        if (currentSeatData && currentSeatData.reservedBy === userId && currentSeatData.status === "occupied") {
                            return {
                                status: "available",
                                reservedBy: null,
                                timestamp: Date.now(),
                                seatDetails: null
                            };
                        } else {
                            return undefined;
                        }
                    });
                    if (committed) {
                        dbOperationSuccess = true;
                    }
                } catch (error) {
                    console.error(`Error al liberar asiento en Firebase ${silla._id}:`, error);
                }
            }

            try {
                await Promise.all([
                    createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'disponible' }),
                    unlockSeat(silla._id, selectedFunctionId)
                ]);
                dbOperationSuccess = true;
            } catch (err) {
                console.error('Error al liberar asiento en Supabase:', err);
            }
        }

        if (carrito.length === 0 && newCarritoState.length > 0) {
            startTimer();
        }
        if (newCarritoState.length === 0 && carrito.length > 0) {
            clearInterval(timerRef.current);
            setTimeLeft(0);
            localStorage.removeItem(`timer-${eventId}-${selectedFunctionId || 'none'}`);
        }

        const sortedCarrito = newCarritoState.slice().sort((a, b) => {
            if (a.nombre && b.nombre) {
                return String(a.nombre).localeCompare(String(b.nombre));
            }
            return (a._id || '').localeCompare(b._id || '');
        });

        setCarrito(sortedCarrito);
    }, [
        carrito,
        selectedFunctionId,
        firebaseEnabled,
        plantillaPrecios,
        zonas,
        appliedDiscount,
        eventId,
        startTimer,
        evento?.otrasOpciones?.registroObligatorioAntesSeleccion,
        db,
        auth,
        currentUserId,
        isAuthReady
    ]);

    useEffect(() => {
        if (JSON.stringify(carrito) !== JSON.stringify(cart)) {
            setCarrito(cart);
        }
    }, [cart, carrito]);

    useEffect(() => {
        if (carrito.length > 0) {
            setCart(carrito, selectedFunctionId);
        }
    }, [carrito, selectedFunctionId, setCart]);

    useEffect(() => {
        cartRef.current = carrito;
    }, [carrito]);

    useEffect(() => {
        let unsubscribe;
        const setupAuthListener = async () => {
            try {
                const authInstance = await auth;
                if (authInstance) {
                    unsubscribe = onAuthStateChanged(authInstance, (user) => {
                        if (user) {
                            setCurrentUserId(user.uid);
                        } else {
                            setCurrentUserId(null);
                        }
                        setIsAuthReady(true);
                    });
                } else {
                    setIsAuthReady(true);
                }
            } catch (error) {
                console.error("Error al configurar el listener de Firebase Auth:", error);
                setIsAuthReady(true);
            }
        };

        setupAuthListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [auth]);

    useEffect(() => {
        let isMounted = true;
        isFirebaseEnabled().then(enabled => {
            if (isMounted) setFirebaseEnabled(enabled);
        });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => { if (eventId) loadEvento(); }, [eventId, loadEvento]);
    useEffect(() => { loadFunciones(); }, [loadFunciones]);
    useEffect(() => { if (funciones.length) loadZonas(); }, [funciones, loadZonas]);
    useEffect(() => {
        if (selectedFunctionId && funciones.length) {
            loadMapaYSeats();
        }
    }, [selectedFunctionId, funciones, loadMapaYSeats]);
    useEffect(() => { fetchPayments().then(setPagos).catch(() => setPagos([])); }, []);

    useFirebaseSeatLocks(selectedFunctionId, zonas, setMapa, cartRef, setCarrito, firebaseEnabled);
    useSeatRealtime({ funcionId: firebaseEnabled ? null : selectedFunctionId, onSeatUpdate: () => {} });
    useEffect(() => () => clearInterval(timerRef.current), []);

    return {
        evento, funciones, selectedFunctionId, setSelectedFunctionId,
        mapa, plantillaPrecios, carrito, zonas, pagos, recintoInfo, tagNames,
        showSeatPopup, closeSeatPopup,
        discountCode, setDiscountCode, appliedDiscount,
        timeLeft, toggleSillaEnCarrito, applyDiscountCode
    };
};

export default useEventData;