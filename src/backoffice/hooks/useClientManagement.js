import { useState } from 'react';
import { message } from 'antd';
import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from '../../supabaseClient';
import useSelectedSeatsStore from '../../stores/useSelectedSeatsStore';

export const useClientManagement = (setCarrito) => {
  // Usar el store unificado para selectedClient
  const { selectedClient, setSelectedClient } = useSelectedSeatsStore();
  
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [paymentResults, setPaymentResults] = useState([]);

  const handleClientSearch = async (searchTerm) => {
    console.log('🔍 [useClientManagement] Buscando clientes con término:', searchTerm);
    setSearchLoading(true);
    try {
      // Usar directamente la tabla profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, login, nombre, apellido, telefono, empresa, email')
        .or(`login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      console.log('✅ [useClientManagement] Resultados encontrados:', data?.length || 0);
      
      return (data || []).map((p) => ({
        id: p.id,
        login: p.login,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono,
        empresa: p.empresa,
        email: p.email || '',
      }));
    } catch (error) {
      console.error('Error searching for client:', error);
      throw error;
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddClient = async (values) => {
    try {
      const { data: userResp, error } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password || 'defaultPassword',
        email_confirm: true,
        user_metadata: { password_set: !!values.password },
      });

      if (error) throw error;

      await new Promise((res) => setTimeout(res, 1500));

      const client = supabaseAdmin || supabase;
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .update({
          login: values.email,
          nombre: values.nombre,
          telefono: values.telefono,
          permisos: { role: 'usuario' },
        })
        .eq('id', userResp.user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setSelectedClient(profileData);
      message.success('Client added successfully');
      return profileData;
    } catch (error) {
      console.error('Error adding client:', error);
      message.error(error.message || 'Error adding client');
      return null;
    }
  };

  const handleLocatorSearch = async (locator) => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`*, user:profiles!usuario_id(*), event:eventos(*), funcion:funciones(*)`)
        .eq('locator', locator)
        .single();

      if (error) throw error;
      if (!data.user) throw new Error('Client information not found in payment');

      // seats may be stored as JSON string, handle both cases
      let seats = [];
      if (Array.isArray(data.seats)) {
        seats = data.seats;
      } else if (typeof data.seats === 'string') {
        try {
          seats = JSON.parse(data.seats);
        } catch {
          try {
            seats = JSON.parse(JSON.parse(data.seats));
          } catch {
            seats = [];
          }
        }
      }

      // Map seats to cart items
      const seatsForCart = seats.map(seat => ({
        _id: seat.id || seat._id,
        nombre: seat.name || seat.nombre,
        precio: seat.price || 0,
        nombreMesa: seat.mesa?.nombre || '',
        zona: seat.zona?.nombre || 'General',
        status: data.status || 'unknown',
        paymentId: data.id,
        locator: data.locator,
        funcionId: data.funcion?.id || data.funcion,
        funcionFecha: data.funcion?.fechaCelebracion,
      }));

      setCarrito(seatsForCart);
      setSelectedClient(data.user);
      setSearchResults([data.user]);
      setClientError(null);
      return data;
    } catch (error) {
      console.error('Error searching by locator:', error);
      setClientError(error.message);
      setSearchResults([]);
      setSelectedClient(null);
      return null;
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePaymentSearch = async (searchTerm) => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`locator.ilike.%${searchTerm}%,discountCode.ilike.%${searchTerm}%`);

      if (error) throw error;

      setPaymentResults(data);
      setClientError(null);
      return data;
    } catch (error) {
      console.error('Error searching payments:', error);
      setClientError(error.message);
      setPaymentResults([]);
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUnifiedSearch = async (searchTerm) => {
    setSearchLoading(true);
    setClientError(null);
    try {
      const clients = await handleClientSearch(searchTerm);
      if (clients.length > 0) {
        setSearchResults(clients);
        setPaymentResults([]);
        return { type: 'clients', data: clients };
      }

      const payments = await handlePaymentSearch(searchTerm);
      setSearchResults([]);
      setPaymentResults(payments);
      return { type: 'payments', data: payments };
    } catch (error) {
      console.error('Search error:', error);
      setClientError(error.message);
      setSearchResults([]);
      setPaymentResults([]);
      throw error;
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setPaymentResults([]);
    setClientError(null);
  };

  return {
    selectedClient,
    setSelectedClient,
    searchResults,
    paymentResults,
    searchLoading,
    clientError,
    handleClientSearch,
    handleAddClient,
    handleLocatorSearch,
    handlePaymentSearch,
    handleUnifiedSearch,
    clearSearchResults
  };
};
