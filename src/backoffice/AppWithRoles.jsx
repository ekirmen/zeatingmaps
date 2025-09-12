import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { RoleProvider } from './components/RoleBasedAccess';
import BackofficeAppWithRoles from './BackofficeAppWithRoles';

const AppWithRoles = () => {
  return (
    <Router>
      <RoleProvider>
        <BackofficeAppWithRoles />
      </RoleProvider>
    </Router>
  );
};

export default AppWithRoles;
