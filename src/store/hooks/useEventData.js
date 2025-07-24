// src/hooks/useEventData.js

import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchMapa, fetchPlantillaPrecios, getFunciones, getMapaPorEvento, fetchDescuentoPorCodigo } from '../services/apistore';
import { fetchZonasPorSala } from '../../services/supabaseServices';
import { fetchSeatsByFuncion, createOrUpdateSeat } from '../../backoffice/services/supabaseSeats';
import { lockSeat, unlockSeat } from '../../backoffice/services/seatLocks';
import { supabase } from '../../supabaseClient';
import { fetchPayments } from '../../backoffice/services/apibackoffice';
import { loadGtm, loadMetaPixel } from '../utils/analytics';
import { isUuid, isNumericId } from '../../utils/isUuid';
import getZonaColor from '../../utils/getZonaColor';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, runTransaction, set } from 'firebase/database';
import { db, isFirebaseEnabled, auth } from '../../services/firebaseClient';
import { signInAnonymously } from 'firebase/auth';
import { supabase } from '../../supabaseClient';

const normalizeId = (obj) => ({ ...obj, id: obj.id || obj._id });

const LOCAL_STORAGE_CART_PREFIX = 'cart';
const LOCAL_STORAGE_SEAT_POPUP_PREFIX = 'seat-popup';

const useEventData = (eventIdOrSlug) => {
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
        const savedTime = localStorage.getItem(`timer-${eventIdOrSlug}-${selectedFunctionId || 'none'}`);
        return savedTime ? parseInt(savedTime, 10) : 0;
    });
    const [firebaseEnabled, setFirebaseEnabled] = useState(false);
    const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Enhanced error handling for event images JSON parsing
    const parseEventImages = (imagenes) => {
        if (!imagenes) return null;
        try {
            const parsed = JSON.parse(imagenes);
            if (!parsed || typeof parsed !== 'object') {
                console.warn("Parsed event images is not an object:", parsed);
                return null;
            }
            return parsed;
        } catch (e) {
            console.error("Error parsing event images JSON:", e);
            return null;
        }
    };

    const { cart, setCart, duration } = useCart();
    const cartRef = useRef([]);
    const timerRef = useRef(null);

    const localStorageCartKey = `${LOCAL_STORAGE_CART_PREFIX}-${evento?.id || eventIdOrSlug}-${selectedFunctionId || 'none'}`;
    const localStorageSeatPopupKey = `${LOCAL_STORAGE_SEAT_POPUP_PREFIX}-${evento?.id || eventIdOrSlug}`;

    // Load cart from localStorage into useCart context
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(localStorageCartKey);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setCart(parsedCart, selectedFunctionId);
            } else {
                setCart([], selectedFunctionId);
            }
        } catch (e) {
            console.error('Error loading cart from localStorage', e);
            setCart([], selectedFunctionId);
        }
    }, [localStorageCartKey, setCart, selectedFunctionId]);

    // Save cart to localStorage whenever `cart` (from context) changes
    useEffect(() => {
        try {
            const cartWithZonaNombre = cart.map(item => ({
                ...item,
                zonaNombre: item.zonaNombre || (item.zona ? zonas.find(z => z.id === item.zona || z._id === item.zona)?.nombre : '') || ''
            }));
            localStorage.setItem(localStorageCartKey, JSON.stringify(cartWithZonaNombre));
        } catch (e) {
            console.error('Error saving cart to localStorage', e);
        }
    }, [cart, localStorageCartKey, zonas]);

    // Sync cartRef with the main cart from useCart
    useEffect(() => {
        cartRef.current = cart;
    }, [cart]);


    const closeSeatPopup = () => {
        setShowSeatPopup(false);
        try {
            localStorage.setItem(localStorageSeatPopupKey, '1');
        } catch (e) {
            console.error('Error saving popup state', e);
        }
    };

    const loadEvento = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`[useEventData DEBUG] Iniciando carga de evento para slug/ID: "${eventIdOrSlug}"`);

            const query = supabase.from('eventos').select(`
                *,
                recintos (
                    nombre
                )
            `);

            let supabaseQuery;
            if (isUuid(eventIdOrSlug)) {
                supabaseQuery = query.eq('id', eventIdOrSlug);
                console.log(`[useEventData DEBUG] Tipo de búsqueda: UUID (id=${eventIdOrSlug})`);
            } else if (isNumericId(eventIdOrSlug)) {
                supabaseQuery = query.eq('id', parseInt(eventIdOrSlug, 10));
                console.log(`[useEventData DEBUG] Tipo de búsqueda: Numérico (id=${parseInt(eventIdOrSlug, 10)})`);
            } else {
                supabaseQuery = query.ilike('slug', eventIdOrSlug);
                console.log(`[useEventData DEBUG] Tipo de búsqueda: Slug (slug=${eventIdOrSlug})`);
            }

            const { data, error: supabaseError } = await supabaseQuery.maybeSingle();

            if (supabaseError) {
                console.error('[useEventData DEBUG] Supabase error al buscar evento:', supabaseError);
                throw supabaseError;
            }

            console.log('[useEventData DEBUG] Datos brutos del evento desde Supabase:', data);

            if (!data) {
                console.warn(`[useEventData DEBUG] No se encontró ningún evento para slug/ID: "${eventIdOrSlug}"`);
                setEvento(null);
                setRecintoInfo(null);
            } else {
                const evt = normalizeId(data);
                setEvento(evt);

                if (data.recintos) {
                    setRecintoInfo(data.recintos);
                    console.log('[useEventData DEBUG] Información del Recinto:', data.recintos);
                } else {
                    setRecintoInfo(null);
                    console.warn('[useEventData DEBUG] No se encontró información del recinto para el evento.');
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
            }
        } catch (err) {
            console.error('[useEventData DEBUG] Error general al cargar evento:', err);
            setError(err);
            setEvento(null);
            setRecintoInfo(null);
        } finally {
            setLoading(false);
            console.log(`[useEventData DEBUG] Finalizada carga de evento para slug/ID: "${eventIdOrSlug}"`);
        }
    }, [eventIdOrSlug, localStorageSeatPopupKey, isUuid, isNumericId]);


    const loadFunciones = useCallback(async () => {
        const id = evento?.id;
        if (!id) {
            console.warn('[useEventData DEBUG] loadFunciones: ID de evento no disponible, omitiendo carga.');
            return;
        }
        try {
            console.log(`[useEventData DEBUG] Cargando funciones para evento ID: ${id}`);
            const data = await getFunciones(id);
            const normalizadas = (data || []).map(normalizeId);
            setFunciones(normalizadas);
            console.log('[useEventData DEBUG] Funciones cargadas:', normalizadas);

            if (normalizadas.length === 1 && !selectedFunctionId) {
                setSelectedFunctionId(normalizadas[0].id);
                console.log(`[useEventData DEBUG] Seleccionada automáticamente la función: ${normalizadas[0].id}`);
            } else if (normalizadas.length > 0 && selectedFunctionId) {
                const funcExists = normalizadas.some(f => String(f.id) === String(selectedFunctionId));
                if (!funcExists) {
                    setSelectedFunctionId(normalizadas[0].id);
                    console.log(`[useEventData DEBUG] Función seleccionada inválida, se cambió a: ${normalizadas[0].id}`);
                }
            } else if (normalizadas.length === 0) {
                setSelectedFunctionId(null); // Clear selected function if no functions found
                console.log('[useEventData DEBUG] No se encontraron funciones para el evento.');
            }
        } catch (err) {
            console.error('[useEventData DEBUG] Error al cargar funciones:', err);
        }
    }, [evento, selectedFunctionId]);


    const loadZonas = useCallback(async () => {
        if (funciones.length === 0) {
            console.warn('[useEventData DEBUG] loadZonas: No hay funciones, omitiendo carga de zonas.');
            setZonas([]);
            return;
        }
        try {
            console.log('[useEventData DEBUG] Cargando zonas...');
            const zonasMap = new Map();
            for (const funcion of funciones) {
                const detalles = funcion?.plantilla?.detalles || [];
                detalles.forEach(d => {
                    if (d.zonaId) zonasMap.set(d.zonaId, { id: d.zonaId, nombre: d.nombre || d.zonaNombre || '', color: d.color });
                });

                const salaId = typeof funcion.sala === 'object' ? funcion.sala.id || funcion.sala._id : funcion.sala;
                if (salaId) {
                    console.log(`[useEventData DEBUG] Buscando zonas para sala ID: ${salaId}`);
                    const zonasSala = await fetchZonasPorSala(salaId);
                    zonasSala.forEach(z => zonasMap.set(z.id || z._id, { id: z.id || z._id, nombre: z.nombre, color: z.color }));
                }
            }
            setZonas([...zonasMap.values()]);
            console.log('[useEventData DEBUG] Zonas cargadas:', [...zonasMap.values()]);
        } catch (err) {
            console.error('[useEventData DEBUG] Error al cargar zonas:', err);
            setZonas([]);
        }
    }, [funciones]);

    const mapaLoadedForFunctionId = useRef(null);

    const loadMapaYSeats = useCallback(async () => {
        if (!selectedFunctionId) {
            console.warn('[useEventData DEBUG] loadMapaYSeats: No hay función seleccionada, omitiendo carga de mapa.');
            setMapa(null);
            return;
        }
        if (mapaLoadedForFunctionId.current === selectedFunctionId) {
            console.log(`[useEventData DEBUG] Mapa para función ${selectedFunctionId} ya cargado, omitiendo.`);
            return;
        }
        const funcion = funciones.find(f => String(f.id) === String(selectedFunctionId));
        if (!funcion) {
            console.warn(`[useEventData DEBUG] loadMapaYSeats: Función ${selectedFunctionId} no encontrada, omitiendo.`);
            setMapa(null);
            return;
        }

        try {
            console.log(`[useEventData DEBUG] Cargando mapa y asientos para función: ${selectedFunctionId}`);
            const salaId = typeof funcion.sala === 'object' ? funcion.sala.id || funcion.sala._id : funcion.sala;
            const [mapaSala, seatStates] = await Promise.all([
                fetchMapa(salaId),
                fetchSeatsByFuncion(selectedFunctionId),
            ]);

            const mapaData = mapaSala || await getMapaPorEvento(evento?.id || funcion.evento);
            if (!mapaData) {
                console.warn(`[useEventData DEBUG] No se encontró data de mapa para función ${selectedFunctionId}.`);
                setMapa(null);
                return;
            }
            const seatMap = Object.fromEntries(seatStates.map(s => [s._id || s.id, s.bloqueado ? 'bloqueado' : s.status]));
            const selectedIds = cart.map(c => c._id);

            const actualizado = {
                ...mapaData,
                contenido: mapaData.contenido.map(elemento => ({
                    ...elemento,
                    sillas: elemento.sillas.map(s => {
                        const zonaId = s.zona || elemento.zona;
                        const baseColor = getZonaColor(zonaId) || 'lightblue';
                        const estado = seatMap[s._id] || 'disponible';
                        const isSelected = selectedIds.includes(s._id);
                        const color = estado === 'reservado'
                            ? 'red'
                            : estado === 'pagado'
                            ? 'gray'
                            : estado === 'seleccionado' || estado === 'bloqueado'
                            ? 'orange'
                            : baseColor;
                        return { ...s, estado, color, selected: isSelected };
                    })
                }))
            };

            setMapa(prevMapa => {
                if (JSON.stringify(prevMapa) === JSON.stringify(actualizado)) {
                    return prevMapa;
                }
                return actualizado;
            });
            mapaLoadedForFunctionId.current = selectedFunctionId;
            console.log(`[useEventData DEBUG] Mapa y asientos cargados para función: ${selectedFunctionId}`);

            if (funcion.plantilla?.id || funcion.plantilla?._id) {
                console.log(`[useEventData DEBUG] Cargando plantilla de precios para función: ${selectedFunctionId}`);
                const plantilla = await fetchPlantillaPrecios(funcion.plantilla.id || funcion.plantilla._id);
                setPlantillaPrecios(plantilla);
                console.log('[useEventData DEBUG] Plantilla de precios cargada:', plantilla);
            }
        } catch (err) {
            console.error('[useEventData DEBUG] Error al cargar mapa/asientos:', err);
            setMapa(null);
        }
    }, [selectedFunctionId, funciones, evento, cart]);

    const startTimer = useCallback(() => {
        if (timerRef.current) {
            return;
        }
        setTimeLeft(duration ? duration * 60 : 900);
        localStorage.setItem(`timer-${evento?.id || eventIdOrSlug}-${selectedFunctionId || 'none'}`, String(duration ? duration * 60 : 900));
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setCart([], selectedFunctionId);
                    localStorage.removeItem(`timer-${evento?.id || eventIdOrSlug}-${selectedFunctionId || 'none'}`);
                    return 0;
                }
                const newTime = prev - 1;
                localStorage.setItem(`timer-${evento?.id || eventIdOrSlug}-${selectedFunctionId || 'none'}`, String(newTime));
                return newTime;
            });
        }, 1000);
    }, [duration, eventIdOrSlug, selectedFunctionId, setCart, evento?.id]);

    const applyDiscountCode = async () => {
        if (!discountCode.trim()) return;
        try {
            console.log(`[useEventData DEBUG] Aplicando código de descuento: "${discountCode}"`);
            const data = await fetchDescuentoPorCodigo(discountCode.trim());
            if (!data) throw new Error('Código no válido');

            const now = Date.now();
            if (data.fechaInicio && new Date(data.fechaInicio).getTime() > now) throw new Error('Descuento no disponible aún');
            if (data.fechaFinal && new Date(data.fechaFinal).getTime() < now) throw new Error('Descuento expirado');
            setAppliedDiscount(data);
            console.log('[useEventData DEBUG] Descuento aplicado:', data);
        } catch (err) {
            console.error('[useEventData DEBUG] Error al aplicar descuento:', err);
            setAppliedDiscount(null);
        }
    };

    const toggleSillaEnCarrito = useCallback(async (silla, mesa) => {
        const zonaId = silla?.zona || mesa?.zona;
        if (!zonaId || ['reservado', 'pagado', 'seleccionado', 'bloqueado'].includes(silla?.estado) || silla?.bloqueado) {
            console.warn(`[useEventData DEBUG] Intento de seleccionar silla no disponible: ${silla._id} (estado: ${silla?.estado})`);
            return;
        }

        const index = cartRef.current.findIndex(item => item._id === silla._id);
        const isAdding = index === -1;
        console.log(`[useEventData DEBUG] Intentando ${isAdding ? 'añadir' : 'quitar'} silla: ${silla._id}`);

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

        let dbOperationSuccess = false;

        const databaseInstance = await db;
        const authInstanceResolved = await auth;

        if (!databaseInstance) {
            console.error("[useEventData DEBUG] Firebase Database no está inicializado o habilitado.");
            alert("Hubo un problema con la conexión a la base de datos. Por favor, recarga la página.");
            return;
        }

        if (!authInstanceResolved) {
            console.error("[useEventData DEBUG] Firebase Auth no está inicializado o habilitado.");
            alert("Hubo un problema con la autenticación. Por favor, recarga la página.");
            return;
        }

        if (!isAuthReady) {
            console.warn("[useEventData DEBUG] Firebase Auth no está listo aún.");
            alert("La sesión no está lista. Por favor, espera un momento y vuelve a intentarlo.");
            return;
        }

        if (!authInstanceResolved.currentUser) {
            try {
                console.log("[useEventData DEBUG] Intentando iniciar sesión anónimamente para carrito.");
                const userCredential = await signInAnonymously(authInstanceResolved);
                setCurrentUserId(userCredential.user.uid);
                console.log("[useEventData DEBUG] Sesión anónima iniciada con UID:", userCredential.user.uid);
            } catch (error) {
                console.error("[useEventData DEBUG] Error al iniciar sesión anónimamente para carrito:", error);
                alert("No pudimos preparar tu sesión para modificar el carrito. Por favor, intenta de nuevo.");
                return;
            }
        }

        let currentUserIdResolved = currentUserId || authInstanceResolved.currentUser?.uid;

        if (isAdding) {
            if (!firebaseEnabled) {
                console.log(`[useEventData DEBUG] Firebase deshabilitado. Reservando asiento ${silla._id} en Supabase.`);
                try {
                    await Promise.all([
                        createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'seleccionado' }),
                        lockSeat(silla._id, 'seleccionado', selectedFunctionId)
                    ]);
                    dbOperationSuccess = true;
                    console.log(`[useEventData DEBUG] Asiento ${silla._id} reservado en Supabase.`);
                } catch (err) {
                    console.error('[useEventData DEBUG] Error al reservar asiento en Supabase (Firebase deshabilitado):', err);
                    alert('Lo siento, el asiento ya no está disponible. Por favor, intenta de nuevo.');
                }
            } else {
                const seatRef = ref(databaseInstance, `seats/${selectedFunctionId}/${silla._id}`);
                const forzarRegistro = evento?.otrasOpciones?.registroObligatorioAntesSeleccion ?? false;

                if (!currentUserIdResolved) {
                    if (forzarRegistro) {
                        alert("Debes iniciar sesión o registrarte para seleccionar un asiento.");
                        return;
                    } else {
                        try {
                            console.log("[useEventData DEBUG] Intentando iniciar sesión anónimamente para selección de asiento.");
                            const userCredential = await signInAnonymously(authInstanceResolved);
                            currentUserIdResolved = userCredential.user.uid;
                            setCurrentUserId(currentUserIdResolved);
                            console.log("[useEventData DEBUG] Sesión anónima iniciada con UID:", currentUserIdResolved);
                        } catch (error) {
                            console.error("[useEventData DEBUG] Error al iniciar sesión anónimamente:", error.code, error.message);
                            alert("No pudimos preparar tu sesión para seleccionar asientos. Por favor, intenta de nuevo.");
                            return;
                        }
                    }
                }

                if (!currentUserIdResolved) {
                    alert("Hubo un problema con tu sesión. Por favor, recarga la página e intenta de nuevo.");
                    return;
                }

                console.log(`[useEventData DEBUG] Intentando transacción de Firebase para asiento ${silla._id}.`);
                try {
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        if (currentSeatData === null || currentSeatData.status === "available") {
                            return {
                                status: "occupied",
                                reservedBy: currentUserIdResolved,
                                timestamp: Date.now(),
                                seatDetails: seatItemData
                            };
                        } else {
                            console.log(`[useEventData DEBUG] Transacción abortada: Asiento ${silla._id} no disponible.`);
                            return undefined;
                        }
                    });

                    if (committed) {
                        const cartSeatRef = ref(databaseInstance, `in-cart/${currentUserIdResolved}/${silla._id}`);
                        await set(cartSeatRef, seatItemData);
                        dbOperationSuccess = true;
                        console.log(`[useEventData DEBUG] Asiento ${silla._id} ocupado en Firebase.`);
                    } else {
                        alert('Lo siento, el asiento acaba de ser tomado por otra persona. Por favor, elige otro.');
                    }
                } catch (error) {
                    console.error(`[useEventData DEBUG] Error en transacción de Firebase para asiento ${silla._id}:`, error);
                    alert('Hubo un error al intentar seleccionar el asiento. Por favor, inténtalo de nuevo.');
                }
            }

            if (dbOperationSuccess) {
                setCart(prevCart => [...prevCart, seatItemData], selectedFunctionId);
                console.log(`[useEventData DEBUG] Asiento ${silla._id} añadido al carrito.`);
            }

        } else { // Removing from cart
            const userId = currentUserIdResolved;
            console.log(`[useEventData DEBUG] Quitando silla ${silla._id} del carrito.`);

            if (firebaseEnabled && userId) {
                const seatRef = ref(databaseInstance, `seats/${selectedFunctionId}/${silla._id}`);
                const cartSeatRef = ref(databaseInstance, `in-cart/${userId}/${silla._id}`);

                try {
                    await set(cartSeatRef, null);
                    console.log(`[useEventData DEBUG] Asiento ${silla._id} eliminado de in-cart en Firebase.`);
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        if (currentSeatData && currentSeatData.reservedBy === userId && currentSeatData.status === "occupied") {
                            return {
                                status: "available",
                                reservedBy: null,
                                timestamp: Date.now(),
                                seatDetails: null
                            };
                        } else {
                            console.log(`[useEventData DEBUG] Transacción de liberación abortada: Asiento ${silla._id} no en estado esperado.`);
                            return undefined;
                        }
                    });
                    if (committed) {
                        dbOperationSuccess = true;
                        console.log(`[useEventData DEBUG] Asiento ${silla._id} liberado en Firebase.`);
                    }
                } catch (error) {
                    console.error(`[useEventData DEBUG] Error al liberar asiento en Firebase ${silla._id}:`, error);
                }
            }

            try {
                await Promise.all([
                    createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'disponible' }),
                    unlockSeat(silla._id, selectedFunctionId)
                ]);
                dbOperationSuccess = true;
                console.log(`[useEventData DEBUG] Asiento ${silla._id} liberado en Supabase.`);
            } catch (err) {
                console.error('[useEventData DEBUG] Error al liberar asiento en Supabase:', err);
                dbOperationSuccess = false;
            }

            if (dbOperationSuccess) {
                setCart(prevCart => prevCart.filter(item => item._id !== silla._id), selectedFunctionId);
                console.log(`[useEventData DEBUG] Asiento ${silla._id} quitado del carrito.`);
            }
        }

        const newCartLength = isAdding ? cartRef.current.length + 1 : cartRef.current.length - 1;

        if (cartRef.current.length === 0 && newCartLength > 0) { // Corrected: Use newCartLength
            startTimer();
            console.log('[useEventData DEBUG] Temporizador iniciado.');
        }
        if (newCartLength === 0 && cartRef.current.length > 0) { // Corrected: Use newCartLength
            clearInterval(timerRef.current);
            setTimeLeft(0);
            localStorage.removeItem(`timer-${evento?.id || eventIdOrSlug}-${selectedFunctionId || 'none'}`);
            console.log('[useEventData DEBUG] Temporizador detenido.');
        }

    }, [
        selectedFunctionId,
        firebaseEnabled,
        plantillaPrecios,
        zonas,
        appliedDiscount,
        eventIdOrSlug,
        startTimer,
        evento?.otrasOpciones?.registroObligatorioAntesSeleccion,
        db,
        auth,
        currentUserId,
        isAuthReady,
        setCart,
        evento?.id,
        isUuid,
        isNumericId
    ]);

    useEffect(() => {
        let unsubscribe;
        const setupAuthListener = async () => {
            try {
                const authInstance = await auth;
                if (authInstance) {
                    unsubscribe = onAuthStateChanged(authInstance, (user) => {
                        if (user) {
                            setCurrentUserId(user.uid);
                            console.log('[useEventData DEBUG] Firebase Auth State Changed: User logged in:', user.uid);
                        } else {
                            setCurrentUserId(null);
                            console.log('[useEventData DEBUG] Firebase Auth State Changed: User logged out.');
                        }
                        setIsAuthReady(true);
                        console.log('[useEventData DEBUG] Firebase Auth Ready.');
                    });
                } else {
                    setIsAuthReady(true);
                    console.log('[useEventData DEBUG] Firebase Auth no inicializado, marcando como listo.');
                }
            } catch (error) {
                console.error("[useEventData DEBUG] Error al configurar el listener de Firebase Auth:", error);
                setIsAuthReady(true);
            }
        };

        setupAuthListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
                console.log('[useEventData DEBUG] Firebase Auth listener desuscrito.');
            }
        };
    }, [auth]);

    useEffect(() => {
        let isMounted = true;
        isFirebaseEnabled().then(enabled => {
            if (isMounted) {
                setFirebaseEnabled(enabled);
                console.log(`[useEventData DEBUG] Firebase habilitado: ${enabled}`);
            }
        });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (eventIdOrSlug) {
            loadEvento();
        } else {
            console.warn('[useEventData DEBUG] eventIdOrSlug es nulo/vacío, no se carga el evento.');
            setLoading(false);
            setEvento(null);
        }
    }, [eventIdOrSlug, loadEvento]);

    useEffect(() => {
        if (evento?.id) {
            loadFunciones();
        } else {
            setFunciones([]);
            setSelectedFunctionId(null);
            console.log('[useEventData DEBUG] Evento ID no disponible, funciones y selección de función limpiadas.');
        }
    }, [evento?.id, loadFunciones]);

    useEffect(() => {
        if (funciones.length) {
            loadZonas();
        } else {
            setZonas([]);
            console.log('[useEventData DEBUG] No hay funciones, zonas limpiadas.');
        }
    }, [funciones, loadZonas]);

    useEffect(() => {
        if (selectedFunctionId && funciones.length) {
            loadMapaYSeats();
        } else {
            setMapa(null);
            console.log('[useEventData DEBUG] No hay función seleccionada o funciones, mapa limpiado.');
        }
    }, [selectedFunctionId, funciones, loadMapaYSeats]);

    useEffect(() => { fetchPayments().then(setPagos).catch(() => setPagos([])); }, []);

    // useFirebaseSeatLocks(selectedFunctionId, zonas, setMapa, cartRef, setCart, firebaseEnabled);
    // useSeatRealtime({ funcionId: firebaseEnabled ? null : selectedFunctionId, onSeatUpdate: () => {} });
    useEffect(() => () => clearInterval(timerRef.current), []);

    return {
        evento, funciones, selectedFunctionId, setSelectedFunctionId,
        mapa, plantillaPrecios, cart, zonas, pagos, recintoInfo, tagNames,
        showSeatPopup, closeSeatPopup,
        discountCode, setDiscountCode, appliedDiscount,
        timeLeft, toggleSillaEnCarrito, applyDiscountCode,
        loading, error
    };
};

export default useEventData;
