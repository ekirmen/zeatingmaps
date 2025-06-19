import { useState } from 'react';
import { message } from 'antd';
import { supabase } from '../services/supabaseClient';

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
        .from('users')
        .select('*')
        .ilike('email', `%${searchTerm}%`);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching for client:', error);
      throw error;
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddClient = async (values) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...values, perfil: 'cliente', empresa: 'default', login: values.email }])
        .select()
        .single();

      if (error) throw error;

      setSelectedClient(data);
      message.success('Client added successfully');
      return data;
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
        .select('*, user:users(*), seats(*)')
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
