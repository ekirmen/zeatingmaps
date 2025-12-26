/**
 * Context para manejar el modal de cuenta de forma global
 * Soluciona problemas con eventos custom en iOS/Safari
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const AccountModalContext = createContext(null);

export const AccountModalProvider = ({ children }) => {
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [accountMode, setAccountMode] = useState('login');
  const [postLoginRedirect, setPostLoginRedirect] = useState(null);
  const [prefillData, setPrefillData] = useState(null);

  const openAccountModal = useCallback((options = {}) => {
    const {
      mode = 'login',
      redirectTo = null,
      prefill = null
    } = options;

    setAccountMode(mode);
    setPostLoginRedirect(redirectTo);
    setPrefillData(prefill);
    setIsAccountModalVisible(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalVisible(false);
    setAccountMode('login');
    setPostLoginRedirect(null);
    setPrefillData(null);
  }, []);

  return (
    <AccountModalContext.Provider
      value={{
        isAccountModalVisible,
        accountMode,
        postLoginRedirect,
        prefillData,
        openAccountModal,
        closeAccountModal,
        setAccountMode,
        setIsAccountModalVisible
      }}
    >
      {children}
    </AccountModalContext.Provider>
  );
};

export const useAccountModal = () => {
  const context = useContext(AccountModalContext);
  if (!context) {
    throw new Error('useAccountModal must be used within AccountModalProvider');
  }
  return context;
};

