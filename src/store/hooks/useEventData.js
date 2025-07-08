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
import { db, auth, isFirebaseEnabled } from '../../services/firebaseClient'; // db y auth son las instancias inicializadas

// Helper function to await db promise before using
const getDbInstance = async () => {
  return await db;
};

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
    const [timeLeft, setTimeLeft] = useState(0);
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
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setCarrito([]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [duration]);


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
        let dbOperationSuccess = false; // Bandera para saber si la operación en la DB fue exitosa

        if (isAdding) {
            // --- Lógica para AÑADIR (Bloquear asiento con transacción Firebase) ---
            if (!firebaseEnabled) {
                console.warn("Firebase no está habilitado. El bloqueo de asientos no será atómico (usando Supabase).");
                try {
                    await Promise.all([
                        createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'bloqueado' }),
                        lockSeat(silla._id, 'bloqueado', selectedFunctionId, { seatDetails: seatItemData }) // Uso de lockSeat de Supabase
                    ]);
                    dbOperationSuccess = true;
                } catch (err) {
                    console.error('Error al bloquear asiento en Supabase (Firebase deshabilitado):', err);
                    alert('Lo siento, el asiento ya no está disponible. Por favor, intenta de nuevo.');
                }
            } else {
                // Lógica con Transacción de Firebase
                const seatRef = await getDbInstance().then(database => ref(database, `seats/${eventId}/${selectedFunctionId}/${silla._id}`));

                // --- INICIO: Lógica para obtener el userId (autenticado o anónimo) ---
                let userId = auth.currentUser ? auth.currentUser.uid : null;
                const forzarRegistro = evento?.otrasOpciones?.registroObligatorioAntesSeleccion ?? false;

                if (!userId) { // Si no hay un usuario logueado (ni real ni anónimo todavía)
                    if (forzarRegistro) {
                        console.error("Usuario no autenticado. Registro obligatorio antes de seleccionar.");
                        alert("Debes iniciar sesión o registrarte para seleccionar un asiento.");
                        return; // Detiene la ejecución si el registro es obligatorio
                    } else {
                        // Intenta iniciar sesión de forma anónima para obtener un UID temporal
                        try {
                            // Wait for auth state to be ready before signing in anonymously
                            await new Promise((resolve, reject) => {
                                const unsubscribe = auth.onAuthStateChanged(user => {
                                    unsubscribe();
                                    resolve(user);
                                }, reject);
                            });
                            if (!auth.currentUser) {
                                const userCredential = await auth.signInAnonymously();
                                userId = userCredential.user.uid;
                                console.log(`Usuario anónimo ${userId} iniciado.`);
                            } else {
                                userId = auth.currentUser.uid;
                            }
                        } catch (error) {
                            console.error("Error al iniciar sesión de forma anónima:", error);
                            alert("No pudimos preparar tu sesión para seleccionar asientos. Por favor, intenta de nuevo.");
                            return; // Detiene la ejecución si falla la autenticación anónima
                        }
                    }
                }
                // --- FIN: Lógica para obtener el userId ---

                if (!userId) { // Última verificación por si algo falla
                    console.error("No se pudo obtener un ID de usuario válido para la transacción.");
                    alert("Hubo un problema con tu sesión. Por favor, recarga la página e intenta de nuevo.");
                    return;
                }

                try {
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        // Si el asiento no existe en Firebase o su estado es "available", intentamos ocuparlo
                        if (currentSeatData === null || currentSeatData.status === "available") {
                            console.log(`[Firebase Transaction] Intentando ocupar asiento ${silla._id} para ${userId}`);
                            return {
                                status: "occupied", // Marcamos como 'ocupado' en Firebase
                                reservedBy: userId, // Este userId será el UID real o el anónimo
                                timestamp: Date.now(),
                                seatDetails: seatItemData // Guardar detalles del asiento para referencia
                            };
                        } else {
                            // El asiento no está disponible (ya "occupied", "blocked", etc.)
                            console.log(`[Firebase Transaction] Asiento ${silla._id} no disponible. Estado actual: ${currentSeatData.status}`);
                            return undefined; // Aborta la transacción
                        }
                    });

                    if (committed) {
                        dbOperationSuccess = true;
                        console.log(`¡Asiento ${silla._id} seleccionado exitosamente por ${userId} en Firebase!`);
                        // Opcional: Si Supabase es un "espejo", actualízalo después del éxito en Firebase
                        // await createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'bloqueado' });
                    } else {
                        console.log(`Transacción de asiento ${silla._id} abortada. El asiento ya fue tomado.`);

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
                // Si la operación de DB falló, no se añade al carrito local
                newCarritoState = carrito;
            }

        } else {
            // --- Lógica para QUITAR (Liberar asiento) ---
            newCarritoState = carrito.filter(item => item._id !== silla._id);

            if (firebaseEnabled) {
                const seatRef = ref(db, `seats/${eventId}/${selectedFunctionId}/${silla._id}`);
                const userId = auth.currentUser ? auth.currentUser.uid : null;

                // Si se va a liberar un asiento, necesitamos un userId, real o anónimo.
                // Si 'userId' es null aquí, es un caso edge que no debería pasar si el asiento
                // fue seleccionado correctamente con un UID previamente.
                if (!userId) {
                    console.warn("Intentando liberar un asiento sin un ID de usuario. Podría ser un error.");
                    // Podrías intentar signInAnonymously aquí también, o simplemente permitirlo si el asiento
                    // no está marcado con un reservedBy.
                }

                try {
                    const { committed } = await runTransaction(seatRef, (currentSeatData) => {
                        // Solo si este usuario lo había reservado y el estado es 'occupied', lo liberamos
                        if (currentSeatData && currentSeatData.reservedBy === userId && currentSeatData.status === "occupied") {
                            console.log(`[Firebase Transaction] Liberando asiento ${silla._id} de ${userId}`);
                            return {
                                status: "available", // Estado 'disponible' en Firebase
                                reservedBy: null,
                                timestamp: Date.now(),
                                seatDetails: null
                            };
                        } else {
                            console.log(`[Firebase Transaction] No se libera asiento ${silla._id}. No fue reservado por este usuario o ya está libre.`);
                            return undefined; // Aborta la transacción
                        }
                    });
                    if (committed) {
                        dbOperationSuccess = true;
                        console.log(`¡Asiento ${silla._id} liberado exitosamente en Firebase!`);
                    } else {
                        console.warn(`No se confirmó la liberación de asiento ${silla._id} en Firebase. Posiblemente ya lo estaba.`);
                    }
                } catch (error) {
                    console.error(`Error al liberar asiento en Firebase ${silla._id}:`, error);
                }
            }

            // Siempre intentar liberar/actualizar en Supabase (o actualizar según tu estrategia)
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

        // Lógica del temporizador
        if (carrito.length === 0 && newCarritoState.length > 0) {
            startTimer();
        }
        if (newCarritoState.length === 0 && carrito.length > 0) {
            clearInterval(timerRef.current);
            setTimeLeft(0);
        }

        // Ordenar el carrito y actualizar el estado
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
        evento?.otrasOpciones?.registroObligatorioAntesSeleccion, // Dependencia para la opción de registro
        // Removed auth and db from dependencies as they are stable and do not cause re-render
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

    useEffect(() => { isFirebaseEnabled().then(setFirebaseEnabled); }, []);
    useEffect(() => { if (eventId) loadEvento(); }, [eventId, loadEvento]);
    useEffect(() => { loadFunciones(); }, [loadFunciones]);
    useEffect(() => { if (funciones.length) loadZonas(); }, [funciones, loadZonas]);
    useEffect(() => {
        if (selectedFunctionId && funciones.length) {
            loadMapaYSeats();
        }
    }, [selectedFunctionId, funciones, loadMapaYSeats]);
    useEffect(() => { fetchPayments().then(setPagos).catch(() => setPagos([])); }, []);

    // Si Firebase está habilitado, useFirebaseSeatLocks escuchará los cambios en Firebase
    useFirebaseSeatLocks(selectedFunctionId, zonas, setMapa, cartRef, setCarrito, firebaseEnabled);
    // useSeatRealtime (para Supabase) solo se usa si Firebase no está habilitado
    useSeatRealtime({ funcionId: firebaseEnabled ? null : selectedFunctionId, onSeatUpdate: () => { /* tu lógica de actualización */ } });
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