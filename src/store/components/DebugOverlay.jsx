import React, { useState, useEffect } from 'react';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import { useSeatLockStore } from '../../components/seatLockStore';

const DebugOverlay = () => {
    const [isOpen, setIsOpen] = useState(false);
    const cartItems = useCartStore((s) => s.items);
    const { user } = useAuth();
    const { connectionIssueDetected } = useSeatLockStore();
    const [isVisible, setIsVisible] = useState(false);

    // Toggle visibility with Ctrl+Shift+D
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#00ff00',
            fontFamily: 'monospace',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '300px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong>🛠️ Debug Panel</strong>
                <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '5px' }}>
                <strong>Status:</strong> {connectionIssueDetected ? '🔴 Disconnected' : '🟢 Connected'}
            </div>

            <div style={{ marginBottom: '5px' }}>
                <strong>User:</strong> {user ? user.email : 'Guest'}
            </div>

            <div style={{ marginBottom: '5px' }}>
                <strong>Cart:</strong> {cartItems.length} items
            </div>

            <details>
                <summary style={{ cursor: 'pointer' }}>Cart Items</summary>
                <pre style={{ margin: 0, maxHeight: '100px', overflow: 'auto' }}>
                    {JSON.stringify(cartItems.map(i => ({ id: i._id, p: i.precio })), null, 2)}
                </pre>
            </details>

            <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                Press Ctrl+Shift+D to toggle
            </div>
        </div>
    );
};

export default DebugOverlay;
