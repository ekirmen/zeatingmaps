# Payment Errors Fix Documentation

## Overview
This document outlines the fixes implemented to resolve the 409 (unique constraint violation) and 400 (invalid JSON syntax) errors in the payment system.

## Issues Identified

### 1. 409 Error - Unique Constraint Violation
**Problem**: The `idx_payments_seat_funcion_unique` constraint was being violated because:
- Seat validation logic was not comprehensive enough
- The `fetchPaymentBySeat` function was not finding existing payments correctly
- Duplicate seat insertions were occurring

**Root Cause**: The `.contains('seats', [{ id: seatId }])` query was not working reliably for all seat data structures.

### 2. 400 Error - Invalid JSON Syntax
**Problem**: The seats data was being stored with invalid JSON structure, causing:
- Database insertion failures
- Query errors when filtering
- Inconsistent data types

**Root Cause**: The `parseSeatsArray` function was not handling all edge cases properly.

## Fixes Implemented

### 1. Enhanced Seat Parsing (`parseSeatsArray`)

```javascript
const parseSeatsArray = (rawSeats) => {
  try {
    let seats = rawSeats;
    
    // Handle null/undefined
    if (seats == null) return [];
    
    // Handle arrays
    if (Array.isArray(seats)) {
      return seats.filter(seat => seat && typeof seat === 'object');
    }
    
    // Handle strings
    if (typeof seats === 'string') {
      const cleanString = seats.trim();
      if (cleanString === '' || cleanString === 'null' || cleanString === 'undefined') {
        return [];
      }
      
      try {
        const parsed = JSON.parse(cleanString);
        if (Array.isArray(parsed)) {
          return parsed.filter(seat => seat && typeof seat === 'object');
        }
        if (parsed && typeof parsed === 'object') {
          return [parsed];
        }
        return [];
      } catch (parseError) {
        console.error('Error parsing seats JSON string:', parseError, 'Raw string:', seats);
        return [];
      }
    }
    
    // Handle individual objects
    if (seats && typeof seats === 'object' && !Array.isArray(seats)) {
      return [seats];
    }
    
    return [];
  } catch (e) {
    console.error('Error parsing seats data:', e, 'Raw data:', rawSeats);
    return [];
  }
};
```

**Improvements**:
- Better null/undefined handling
- String cleaning before parsing
- Support for individual objects
- Comprehensive error logging

### 2. Enhanced Seat Validation in `createPayment`

```javascript
// Validate that seats have correct structure
const validatedSeats = seatsForDB.map(seat => {
  if (!seat.id && !seat._id) {
    throw new Error(`Asiento sin ID válido: ${JSON.stringify(seat)}`);
  }
  return {
    id: seat.id || seat._id,
    name: seat.name || seat.nombre || 'Asiento',
    price: parseFloat(seat.price || seat.precio || 0),
    zona: seat.zona?.nombre || seat.zona || 'General',
    mesa: seat.mesa?.nombre || seat.mesa || null,
    ...(seat.abonoGroup ? { abonoGroup: seat.abonoGroup } : {})
  };
});
```

**Improvements**:
- Mandatory ID validation
- Data normalization
- Default values for missing fields
- Price parsing with fallback

### 3. Improved `fetchPaymentBySeat` Function

```javascript
export const fetchPaymentBySeat = async (funcionId, seatId) => {
  // Parameter validation
  if (!funcionId || !seatId) {
    console.warn('Invalid parameters:', { funcionId, seatId });
    return null;
  }
  
  try {
    // Multiple search strategies
    let query = client
      .from('payments')
      .select('*, seats, funcion, event:eventos(*), user:profiles!usuario_id(*)')
      .eq('funcion', funcionId);
    
    // Try contains query first
    const { data, error } = await query
      .contains('seats', [{ id: seatId }])
      .or(`seats.cs.[{"_id":"${seatId}"}],seats.cs.[{"id":"${seatId}"}]`);
    
    // Fallback to manual search if contains fails
    if (!data || data.length === 0) {
      const { data: allPayments, error: allError } = await client
        .from('payments')
        .select('*, seats, funcion, event:eventos(*), user:profiles!usuario_id(*)')
        .eq('funcion', funcionId);
      
      if (!allError) {
        for (const payment of allPayments || []) {
          const paymentSeats = parseSeatsArray(payment.seats);
          const foundSeat = paymentSeats.find(seat => 
            seat.id === seatId || seat._id === seatId
          );
          
          if (foundSeat) {
            return payment;
          }
        }
      }
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Unexpected error in fetchPaymentBySeat:', error);
    return null;
  }
};
```

**Improvements**:
- Multiple search strategies
- Fallback to manual search
- Better error handling
- Comprehensive logging

### 4. Enhanced Cart Validation

```javascript
const handleCheckout = () => {
  if (itemCount === 0) {
    message.warning('El carrito está vacío');
    return;
  }
  
  // Validate seat IDs
  const invalidSeats = items?.filter(item => !item.id && !item._id) || [];
  if (invalidSeats.length > 0) {
    message.error('Algunos asientos no tienen IDs válidos. Por favor, recarga la página.');
    return;
  }
  
  // Check for duplicates
  const seatIds = items?.map(item => item.id || item._id) || [];
  const uniqueSeatIds = [...new Set(seatIds)];
  if (seatIds.length !== uniqueSeatIds.length) {
    message.error('Hay asientos duplicados en el carrito. Por favor, verifica.');
    return;
  }
  
  navigate('/checkout');
};
```

**Improvements**:
- Pre-checkout validation
- Duplicate detection
- User-friendly error messages

## Database Schema Considerations

### 1. Unique Constraint
The `idx_payments_seat_funcion_unique` constraint should be:
```sql
CREATE UNIQUE INDEX idx_payments_seat_funcion_unique 
ON payments (funcion, (seats->>'id'));
```

### 2. Seats Column Type
Ensure the `seats` column is of type `JSONB` to properly handle array operations.

### 3. Indexes
Consider adding these indexes for better performance:
```sql
CREATE INDEX idx_payments_funcion_status ON payments(funcion, status);
CREATE INDEX idx_payments_seats_gin ON payments USING GIN (seats);
```

## Testing Recommendations

### 1. Test Cases
- Create payment with single seat
- Create payment with multiple seats
- Attempt to create duplicate seat payment
- Test with various seat data formats
- Test edge cases (null, undefined, malformed JSON)

### 2. Error Scenarios
- Duplicate seat in same function
- Invalid seat data structure
- Missing seat IDs
- Database connection issues

## Monitoring and Logging

### 1. Key Metrics
- Payment creation success rate
- Seat validation failures
- Database constraint violations
- Response times for seat queries

### 2. Logging
- All seat validation attempts
- Payment creation requests
- Database errors with context
- Performance metrics

## Future Improvements

### 1. Transaction Management
- Implement database transactions for multi-seat payments
- Rollback on partial failures
- Atomic operations

### 2. Caching
- Cache seat availability status
- Reduce database queries
- Improve performance

### 3. Real-time Updates
- WebSocket notifications for seat status changes
- Live seat availability updates
- Conflict resolution

## Conclusion

These fixes address the root causes of both the 409 and 400 errors by:
1. Improving data validation and normalization
2. Implementing comprehensive seat checking
3. Adding fallback search strategies
4. Enhancing error handling and logging
5. Adding pre-checkout validation

The system should now be more robust and provide better error messages to users while preventing duplicate seat insertions.
