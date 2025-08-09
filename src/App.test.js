// Mocks antes de importar App
jest.mock('./contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({ user: null, loading: false, login: jest.fn(), logout: jest.fn() })
  };
});

jest.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {}
  }
}), { virtual: true });

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders app shell', () => {
  const { container } = render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );
  expect(container.firstChild).toBeTruthy();
});
