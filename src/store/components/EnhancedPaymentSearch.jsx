import React, { useState } from 'react';
import { Input, Button, Radio, Tag, Space, Typography, message } from 'antd';
import { SearchOutlined, UserOutlined, TicketOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EnhancedPaymentSearch = ({ onLocatorFound, onClearLocator, currentLocator }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchType, setSearchType] = useState('locator'); // 'locator' or 'email'
    const [searchResults, setSearchResults] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        
        setSearching(true);
        try {
            if (searchType === 'locator') {
                // Búsqueda por localizador
                const response = await fetch(`/api/payments/${searchValue.trim()}/debug`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.payment) {
                        onLocatorFound(data.payment, searchValue.trim());
                        message.success(`Localizador encontrado: ${searchValue.trim()}`);
                        setSearchResults([data.payment]);
                        setUserInfo(data.payment.user);
                    } else {
                        message.error('Localizador no encontrado');
                        setSearchResults([]);
                        setUserInfo(null);
                    }
                } else {
                    message.error('Error al buscar localizador');
                    setSearchResults(null);
                }
            } else {
                // Búsqueda por email
                const response = await fetch(`/api/payments/search-by-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: searchValue.trim() })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.payments && data.payments.length > 0) {
                        setSearchResults(data.payments);
                        setUserInfo(data.user);
                        message.success(`${data.payments.length} pagos encontrados para ${data.user.login}`);
                    } else {
                        setSearchResults([]);
                        setUserInfo(null);
                        message.info('No se encontraron pagos para ese email');
                    }
                } else {
                    message.error('Error al buscar por email');
                    setSearchResults(null);
                    setUserInfo(null);
                }
            }
        } catch (error) {
            console.error('Error searching:', error);
            message.error(`Error al buscar por ${searchType === 'locator' ? 'localizador' : 'email'}`);
            setSearchResults(null);
        } finally {
            setSearching(false);
        }
    };

    const handleClear = () => {
        setSearchValue('');
        setSearchResults(null);
        setUserInfo(null);
        onClearLocator();
        message.info('Búsqueda limpiada');
    };

    const handlePaymentSelect = (payment) => {
        if (searchType === 'locator') {
            onLocatorFound(payment, payment.locator);
        } else {
            // Para búsqueda por email, usar el localizador del pago seleccionado
            onLocatorFound(payment, payment.locator);
        }
    };

    return (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
                <SearchOutlined className="text-blue-500" />
                <Text strong className="text-blue-800">Búsqueda de Pagos</Text>
            </div>
            
            {currentLocator ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Tag color="blue" className="text-sm">
                            Localizador: {currentLocator}
                        </Tag>
                        <Text type="secondary" className="text-xs">
                            Pago encontrado
                        </Text>
                    </div>
                    <Button 
                        size="small" 
                        danger 
                        onClick={handleClear}
                        icon={<DeleteOutlined />}
                    >
                        Limpiar
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Selector de tipo de búsqueda */}
                    <div>
                        <Radio.Group 
                            value={searchType} 
                            onChange={(e) => setSearchType(e.target.value)}
                            buttonStyle="solid"
                            size="small"
                        >
                            <Radio.Button value="locator">
                                <TicketOutlined /> Por Localizador
                            </Radio.Button>
                            <Radio.Button value="email">
                                <UserOutlined /> Por Email
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Input
                            placeholder={searchType === 'locator' ? 'Ingresa el localizador (ej: S0KOUN4)' : 'Ingresa el email del usuario'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onPressEnter={handleSearch}
                            className="flex-1"
                        />
                        <Button 
                            type="primary" 
                            onClick={handleSearch}
                            loading={searching}
                            icon={<SearchOutlined />}
                        >
                            Buscar
                        </Button>
                    </div>
                    
                    {/* Información del usuario (solo para búsqueda por email) */}
                    {userInfo && searchType === 'email' && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm">
                                <div><strong>Email:</strong> {userInfo.login}</div>
                                {userInfo.empresa && <div><strong>Empresa:</strong> {userInfo.empresa}</div>}
                                {userInfo.telefono && <div><strong>Teléfono:</strong> {userInfo.telefono}</div>}
                            </div>
                        </div>
                    )}
                    
                    {/* Resultados de la búsqueda */}
                    {searchResults && (
                        <div className="mt-3">
                            <div className="text-sm font-medium mb-2">
                                {searchType === 'locator' ? 'Resultado de Búsqueda' : 'Pagos Encontrados'}
                            </div>
                            
                            {searchResults.length === 0 ? (
                                <div className="text-center text-gray-500 py-2">
                                    No se encontraron resultados
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((payment) => (
                                        <div key={payment.id} className="p-2 bg-white border rounded flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    <Tag color="blue" className="text-xs">
                                                        {payment.locator}
                                                    </Tag>
                                                    {payment.event?.nombre || 'Evento'}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {payment.seats?.length || 0} asientos • 
                                                    ${(payment.seats?.reduce((sum, seat) => sum + (seat.price || 0), 0) || 0).toFixed(2)} • 
                                                    {payment.status === 'pagado' ? 'Pagado' : 'Reservado'}
                                                </div>
                                            </div>
                                            <Button 
                                                size="small" 
                                                type="primary"
                                                onClick={() => handlePaymentSelect(payment)}
                                            >
                                                Seleccionar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EnhancedPaymentSearch;
