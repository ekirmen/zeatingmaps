import { useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../../services/firebaseClient';
import getZonaColor from '../../utils/getZonaColor';

const useFirebaseSeatLocks = (functionId, zonas, setMapa, cartRef, setCarrito, firebaseEnabled) => {
    const alertShownRef = useRef(new Set());

    useEffect(() => {
        if (!firebaseEnabled || !functionId) {
            return;
        }

        const seatRef = ref(db, `seats/${functionId}`);
        const currentUserId = auth.currentUser?.uid;

        const unsubscribe = onValue(seatRef, (snapshot) => {
            const seatLocks = snapshot.val() || {};

            setMapa(prevMapa => {
                if (!prevMapa) return null;

                const newContenido = prevMapa.contenido.map(elemento => ({
                    ...elemento,
                    sillas: elemento.sillas.map(silla => {
                        const lockInfo = seatLocks[silla._id];
                        const isInMyCart = cartRef.current.some(item => item._id === silla._id);
                        
                        let estado = 'disponible';
                        let color;

                        if (lockInfo) {
                            if (lockInfo.status === 'occupied') {
                                if (isInMyCart && lockInfo.reservedBy === currentUserId) {
                                    estado = 'seleccionado';
                                    color = '#3498db';
                                } else {
                                    estado = 'reservado';
                                    color = '#e74c3c';
                                }
                            } else {
                                estado = lockInfo.status || 'bloqueado';
                                color = 'gray';
                            }
                        } else {
                             estado = 'disponible';
                             const zonaId = silla.zona || elemento.zona;
                             color = getZonaColor(zonaId) || 'lightblue';
                        }
                        
                        return { ...silla, estado, color, selected: isInMyCart };
                    }),
                }));

                return { ...prevMapa, contenido: newContenido };
            });

            const seatsToRemove = new Set();
            for (const itemInCart of cartRef.current) {
                const lockInfo = seatLocks[itemInCart._id];
                if (lockInfo && lockInfo.status === 'occupied' && lockInfo.reservedBy !== currentUserId) {
                    seatsToRemove.add(itemInCart._id);
                }
            }

            if (seatsToRemove.size > 0) {
                const newCart = cartRef.current.filter(item => !seatsToRemove.has(item._id));
                setCarrito(newCart);

                seatsToRemove.forEach(seatId => {
                    if (!alertShownRef.current.has(seatId)) {
                        const seatName = cartRef.current.find(s => s._id === seatId)?.nombre || `Seat ${seatId.substring(0, 4)}`;
                        alert(`Sorry, ${seatName} was just taken by another user and has been removed from your cart.`);
                        alertShownRef.current.add(seatId);
                    }
                });
            }
        });

        return () => {
            unsubscribe();
        };

    }, [functionId, firebaseEnabled, setMapa, setCarrito, cartRef, zonas]);
};

export default useFirebaseSeatLocks;