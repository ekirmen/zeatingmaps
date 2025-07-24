import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SeatMap from './SeatMap';
import * as firebaseClient from '../services/firebaseClient';

// Mock Firebase Realtime Database functions
jest.mock('firebase/database', () => {
  return {
    ref: jest.fn(),
    onValue: jest.fn(),
    off: jest.fn(),
    update: jest.fn(),
  };
});

describe('SeatMap Component', () => {
  const funcionId = 'testFuncion';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(<SeatMap funcionId={funcionId} />);
    expect(screen.getByText(/Cargando asientos/i)).toBeInTheDocument();
  });

  test('renders seats and allows selection and deselection', async () => {
    const seatsData = {
      seat1: { name: 'A1', status: 'available' },
      seat2: { name: 'A2', status: 'selected', selected_by: 'session1' },
      seat3: { name: 'A3', status: 'blocked' },
    };

    const onValueMock = require('firebase/database').onValue;
    const offMock = require('firebase/database').off;
    const updateMock = require('firebase/database').update;

    // Mock getDatabaseInstance to resolve to a dummy db object
    jest.spyOn(firebaseClient, 'getDatabaseInstance').mockResolvedValue({});

    // Mock onValue to call the handler with seatsData
    onValueMock.mockImplementation((ref, callback) => {
      callback({ val: () => seatsData });
      return () => {};
    });

    render(<SeatMap funcionId={funcionId} />);

    // Wait for seats to be rendered
    await waitFor(() => {
      expect(screen.getByText('A1')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('A2')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('A3')).toBeInTheDocument();
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
