import { useState } from 'react';
import { message } from 'antd';
import { supabase, supabaseAdmin } from '../services/supabaseClient';

export const useClientManagement = (setCarrito) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [paymentResults, setPaymentResults] = useState([]);

  const handleClientSearch = async (searchTerm) => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, login, nombre, apellido, telefono, empresa, auth:auth.users(email)')
        .or(
          `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,auth.email.ilike.%${searchTerm}%`
        );

      if (error) throw error;
      return data.map((p) => ({
        id: p.id,
        login: p.login,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono,
        empresa: p.empresa,
        email: p.auth?.email || '',
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
      });

      if (error) throw error;

      await new Promise((res) => setTimeout(res, 1500));

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          login: values.email,
          nombre: values.nombre,
          telefono: values.telefono,
          empresa: values.empresa || 'default',
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
        .from('tickets')
        .select('*, user:profiles(*), seats(*)')
        .eq('locator', locator)
        .single();

      if (error) throw error;
      if (!data.user) throw new Error('Client information not found in ticket');

      setCarrito([data]);
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
    try {
      const clients = await handleClientSearch(searchTerm);
      if (clients.length > 0) {
        return { type: 'clients', data: clients };
      }

      const payments = await handlePaymentSearch(searchTerm);
      return { type: 'payments', data: payments };
    } catch (error) {
      console.error('Search error:', error);
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
