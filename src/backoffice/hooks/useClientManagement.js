import { useState } from 'react';
import { message } from 'antd';

export const useClientManagement = (setCarrito) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [paymentResults, setPaymentResults] = useState([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')?.replace('Bearer ', '');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

 // En tu función handleClientSearch dentro de useClientManagement
const handleClientSearch = async (searchTerm) => {
  setSearchLoading(true);
  try {
    const token = localStorage.getItem('token')?.replace('Bearer ', '');
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/user/search?term=${encodeURIComponent(searchTerm)}`,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch client data');
    }

    const data = await response.json();
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...values,
          perfil: 'cliente',
          empresa: 'default',
          login: values.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add client');
      }

      const newUser = await response.json();
      setSelectedClient(newUser);
      message.success('Client added successfully');
      return newUser;
    } catch (error) {
      console.error('Error adding client:', error);
      message.error(error.message || 'Error adding client');
      return null;
    }
  };

  const handleLocatorSearch = async (locator) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tickets/locator/${locator}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ticket not found');
      }

      const ticketData = await response.json();
      
      if (!ticketData.user) {
        throw new Error('Client information not found in ticket');
      }

      // Set the cart with the ticket data
      setCarrito([ticketData]);
      
      // Set the client information
      setSelectedClient(ticketData.user);
      setSearchResults([ticketData.user]);
      setClientError(null);
      return ticketData;
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/search?term=${encodeURIComponent(searchTerm)}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search payments');
      }

      const data = await response.json();
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
      // Primero buscar clientes directamente
      const clients = await handleClientSearch(searchTerm);
      if (clients.length > 0) {
        return { type: 'clients', data: clients };
      }
  
      // Si no hay clientes, buscar pagos
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