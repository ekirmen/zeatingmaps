import seatPaymentChecker from '../../services/seatPaymentChecker';

// Re-export the shared seatPaymentChecker service for modules under src/store
// that rely on relative imports like "../services/seatPaymentChecker". This
// keeps backwards compatibility while ensuring a single source of logic.
export default seatPaymentChecker;
