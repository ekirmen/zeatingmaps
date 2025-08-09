import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SeatMap from './SeatMap';
// Mock supabaseClient para que los hooks no ejecuten queries reales
jest.mock('../supabaseClient', () => {
  const channels = [];
  return {
    supabase: {
      auth: { getSession: jest.fn(async () => ({ data: { session: null }, error: null })) },
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(async () => ({ data: [], error: null })) })),
        upsert: jest.fn(async () => ({ error: null })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(async () => ({ error: null }))
            }))
          }))
        }))
      })),
      channel: jest.fn((topic) => ({
        topic,
        on: jest.fn(() => ({ subscribe: jest.fn(() => 'SUBSCRIBED') })),
        unsubscribe: jest.fn()
      })),
      getChannels: jest.fn(() => channels),
      removeChannel: jest.fn()
    }
  };
}, { virtual: true });

// También mockear la ruta usada por hooks: '../../supabaseClient'
jest.mock('../../supabaseClient', () => {
  const channels = [];
  return {
    supabase: {
      auth: { getSession: jest.fn(async () => ({ data: { session: null }, error: null })) },
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(async () => ({ data: [], error: null })) })),
        upsert: jest.fn(async () => ({ error: null })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(async () => ({ error: null }))
            }))
          }))
        }))
      })),
      channel: jest.fn((topic) => ({
        topic,
        on: jest.fn(() => ({ subscribe: jest.fn(() => 'SUBSCRIBED') })),
        unsubscribe: jest.fn()
      })),
      getChannels: jest.fn(() => channels),
      removeChannel: jest.fn()
    }
  };
}, { virtual: true });

// Mock Firebase Realtime Database functions
jest.mock('firebase/database', () => {
  return {
    ref: jest.fn(),
    onValue: jest.fn(),
    off: jest.fn(),
    update: jest.fn(),
  };
}, { virtual: true });

// Mock del hook para evitar lógica interna con Supabase en tests
jest.mock('../store/hooks/useSeatLocksArray', () => {
  return jest.fn(() => ({
    lockedSeats: [],
    isSeatLocked: jest.fn(() => false),
    isSeatLockedByMe: jest.fn(() => false),
    lockSeat: jest.fn(),
    unlockSeat: jest.fn()
  }));
});

describe('SeatMap Component', () => {
  const funcionId = 'testFuncion';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global crypto for tests
    global.crypto = {
      randomUUID: () => 'test-uuid'
    };
  });

  test('renders without crashing', () => {
    const { container } = render(<SeatMap funcionId={funcionId} />);
    expect(container.firstChild).toBeTruthy();
  });

  test.skip('renders seats and allows selection and deselection', async () => {
    const seatsData = {
      seat1: { name: 'A1', status: 'available' },
      seat2: { name: 'A2', status: 'available' },
      seat3: { name: 'A3', status: 'blocked' },
    };

    const onValueMock = require('firebase/database').onValue;
    const offMock = require('firebase/database').off;
    const updateMock = require('firebase/database').update;

    // Mock onValue no-op para no depender de Firebase
    onValueMock.mockImplementation((ref, callback) => {
      callback({ val: () => seatsData });
      return () => {};
    });

    render(<SeatMap funcionId={funcionId} />);

    // Verificar que el encabezado base exista y no crashea
    await waitFor(() => {
      expect(screen.getByText('Selección de Asientos')).toBeInTheDocument();
    });

    // Click on available seat to select it
    fireEvent.click(screen.getByText('A1'));
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    });

    // Click on selected seat by another session should alert
    window.alert = jest.fn();
    fireEvent.click(screen.getByText('A2'));
    expect(window.alert).toHaveBeenCalledWith('Este asiento ya está seleccionado por otro usuario');

    // Click on blocked seat should alert
    fireEvent.click(screen.getByText('A3'));
    expect(window.alert).toHaveBeenCalledTimes(2);

    // Cleanup
    offMock.mockClear();
  });
});
