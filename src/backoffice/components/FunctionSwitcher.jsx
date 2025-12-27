import React from 'react';
import { Tag, Button } from '../../utils/antdComponents';
import { Calendar, Clock, ShoppingCart } from 'lucide-react';
import formatDateString from '../../utils/formatDateString';

const FunctionSwitcher = ({
    funciones = [],
    selectedFuncion,
    onFunctionChange,
    cartItems = []
}) => {
    // Count items per function
    const getItemCountForFunction = (funcionId) => {
        return cartItems.filter(item => item.funcionId === funcionId).length;
    };

    // Format time from ISO string
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    if (!funciones || funciones.length === 0) {
        return null;
    }

    // Only show if there are multiple functions
    if (funciones.length === 1) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Funciones Disponibles
                </h3>
                <Tag color="blue" className="text-xs">
                    {funciones.length} funciones
                </Tag>
            </div>

            <div className="space-y-2">
                {funciones.map((funcion) => {
                    const isActive = selectedFuncion?.id === funcion.id;
                    const itemCount = getItemCountForFunction(funcion.id);
                    const fecha = formatDateString(funcion.fecha_celebracion || funcion.fechaCelebracion);
                    const hora = formatTime(funcion.fecha_celebracion || funcion.fechaCelebracion);

                    return (
                        <button
                            key={funcion.id}
                            onClick={() => onFunctionChange(funcion)}
                            className={`
                w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                ${isActive
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                                }
              `}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                        <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {fecha}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{hora}</span>
                                    </div>

                                    {funcion.nombre && (
                                        <div className="text-xs text-gray-600 ml-4 mt-1 truncate">
                                            {funcion.nombre}
                                        </div>
                                    )}
                                </div>

                                {itemCount > 0 && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <ShoppingCart className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-semibold text-blue-600">
                                            {itemCount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isActive && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                    <span className="text-xs text-blue-600 font-medium">
                                        ● Función activa
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    <span>
                        Total en carrito: {cartItems.length} {cartItems.length === 1 ? 'asiento' : 'asientos'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FunctionSwitcher;
