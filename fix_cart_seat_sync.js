// Script temporal para arreglar el problema de desbloqueo de asientos
// Ejecuta este script en la consola del navegador después de un pago exitoso

(function() {
    console.log('🔧 [FIX] Aplicando parche temporal para clearCart...');
    
    // Verificar si window.useCartStore está disponible
    if (window.useCartStore && window.useCartStore.getState) {
        const originalClearCart = window.useCartStore.getState().clearCart;
        
        // Crear una versión modificada que no intente desbloquear asientos
        const patchedClearCart = async function(skipUnlock = true) {
            console.log('🔧 [FIX] Usando clearCart parcheado (skipUnlock = true)');
            
            const { items } = window.useCartStore.getState();
            
            // Limpiar el estado del carrito sin intentar desbloquear
            window.useCartStore.setState({ 
                items: [], 
                products: [],
                functionId: null, 
                cartExpiration: null, 
                timeLeft: 0 
            });
            
            console.log('✅ [FIX] Carrito limpiado sin intentar desbloquear asientos');
        };
        
        // Reemplazar la función clearCart
        window.useCartStore.setState({ clearCart: patchedClearCart });
        
        console.log('✅ [FIX] Parche aplicado exitosamente');
    } else {
        console.log('❌ [FIX] window.useCartStore no está disponible');
    }
})();