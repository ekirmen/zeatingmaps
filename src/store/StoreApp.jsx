/* eslint-disable import/first */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { RefProvider } from '../contexts/RefContext';
import { TenantProvider } from '../contexts/TenantContext';
import SecurityHandler from './components/SecurityHandler';
import Header from './components/StoreHeader';
import BasicFooter from '../components/BasicFooter';
import GlobalCartTimer from './components/GlobalCartTimer';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useCartStore } from './cartStore';
import ProtectedRoute from './components/ProtectedRoute';
import { loadGtm, loadMetaPixel, trackEvent } from './utils/analytics';
import './styles/store-design.css';

// Lazy load con prefetch
const lazyImport = (path) => React.lazy(() => import(`${path}` /* webpackPrefetch: true */));

const Pages = {
  SelectSeats: lazyImport('./pages/SelectSeats'),
  Event: lazyImport('./pages/Event'),
  EventInfo: lazyImport('./pages/EventInfo'),
  BuyEvent: lazyImport('./pages/BuyEvent'),
  CartPage: lazyImport('./pages/Cart'),
  Pay: lazyImport('./pages/Pay'),
  Profile: lazyImport('./pages/profile.js'),
  ModernEventPage: lazyImport('./pages/ModernEventPage'),
  EventMapPage: lazyImport('./pages/EventMapPage'),
  ModernStorePage: lazyImport('./pages/ModernStorePage'),
  ThankYouPage: lazyImport('./pages/ThankYouPage'),
  StoreLogin: lazyImport('./pages/Login'),
  Register: lazyImport('./pages/Register'),
  ForgotPassword: lazyImport('./pages/ForgotPassword'),
  ResetPassword: lazyImport('./pages/ResetPassword'),
  EventSearchMap: lazyImport('./pages/EventSearchMap'),
  PaymentSuccess: lazyImport('./pages/PaymentSuccess'),
  FaqPage: lazyImport('./pages/FaqPage'),
  SeatSelectionPage: lazyImport('./pages/SeatSelectionPage'),
  PrivacyPolicy: lazyImport('./pages/PrivacyPolicy'),
  CookiesPolicy: lazyImport('./pages/CookiesPolicy'),
  LegalTerms: lazyImport('./pages/LegalTerms'),
  CmsPage: lazyImport('./pages/CmsPage'),
  EventsVenue: lazyImport('./pages/EventsVenue'),
  NotFound: lazyImport('./pages/NotFound'),
};

const StoreApp = () => {
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const restoreTimer = useCartStore((s) => s.restoreTimer);
  const { currentTenant, domainConfig } = useTenant();
  const previousPath = React.useRef(location.pathname);
  const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;

  if (DEBUG) console.log('🚀 StoreApp render', location.pathname, user);

  React.useEffect(() => restoreTimer(), [restoreTimer]);

  React.useEffect(() => {
    if (DEBUG) return;
    const analyticsConfig = currentTenant?.analytics || domainConfig?.analytics;
    if (!analyticsConfig?.enabled) return;

    const metaPixelId = analyticsConfig?.metaPixelId || localStorage.getItem('metaPixelId');
    const gtmId = analyticsConfig?.gtmId || analyticsConfig?.gtm_id;
    if (metaPixelId) loadMetaPixel(metaPixelId);
    if (gtmId) loadGtm(gtmId);
  }, [currentTenant?.analytics, domainConfig?.analytics, DEBUG]);

  React.useEffect(() => {
    const prev = previousPath.current;
    const curr = location.pathname;
    if (prev !== curr) {
      if (prev?.includes('/store/payment') && !curr.includes('/store/payment-success')) {
        trackEvent('checkout_abandoned', { path: prev, next: curr });
      }
      if (curr.includes('/store/payment-success') || curr.includes('/payment-success')) {
        trackEvent('checkout_confirmed', { path: curr });
      }
      previousPath.current = curr;
    }
  }, [location.pathname]);

  const showHeader = location.pathname.startsWith('/store') || location.pathname.startsWith('/payment-success');
  const showFooter = showHeader;

  return (
    <TenantProvider>
      <RefProvider>
        <SecurityHandler>
          <div className="min-h-screen flex flex-col">
            {showHeader && <Header />}
            <div className="flex-grow">
              <Suspense fallback={<div style={{ padding: 40 }}>Cargando...</div>}>
                <Routes>
                  <Route index element={<Pages.ModernStorePage />} />
                  <Route path="tag/:tagSlug?" element={<Pages.EventsVenue groupByTags />} />
                  <Route path="eventos/:eventSlug/map" element={<Pages.EventMapPage />} />
                  <Route path="eventos/:eventSlug" element={<Pages.ModernEventPage />} />
                  <Route path="event/:eventId" element={<Pages.EventInfo />} />
                  <Route path="event/:eventId/full" element={<Pages.Event />} />
                  <Route path="buy-event/:id" element={<Pages.BuyEvent />} />
                  <Route path="select-seats/:salaId" element={<Pages.SelectSeats />} />
                  <Route path="select-seats/:salaId/:funcionId" element={<Pages.SelectSeats />} />
                  <Route path="seat-selection/:funcionId" element={<Pages.SeatSelectionPage />} />
                  <Route path="cart" element={<Pages.CartPage />} />
                  <Route path="payment" element={<ProtectedRoute requireTenantAccess={false}><Pages.Pay /></ProtectedRoute>} />
                  <Route path="login" element={<Pages.StoreLogin />} />
                  <Route path="register" element={<Pages.Register />} />
                  <Route path="forgot-password" element={<Pages.ForgotPassword />} />
                  <Route path="reset-password" element={<Pages.ResetPassword />} />
                  <Route path="search-map" element={<Pages.EventSearchMap />} />
                  <Route path="faq" element={<Pages.FaqPage />} />
                  <Route path="perfil" element={<Pages.Profile userData={user} onUpdateProfile={updateProfile} />} />
                  <Route path="privacy-policy" element={<Pages.PrivacyPolicy />} />
                  <Route path="cookies-policy" element={<Pages.CookiesPolicy />} />
                  <Route path="legal-terms" element={<Pages.LegalTerms />} />
                  <Route path=":pageSlug" element={<Pages.CmsPage />} />
                  <Route path="payment-success/:locator?" element={<ProtectedRoute requireTenantAccess={false}><Pages.PaymentSuccess /></ProtectedRoute>} />
                  <Route path="thank-you" element={<Pages.ThankYouPage />} />
                  <Route path="404" element={<Pages.NotFound />} />
                  <Route path="*" element={<Pages.NotFound />} />
                </Routes>
              </Suspense>
            </div>
            {showFooter && <BasicFooter />}
            <GlobalCartTimer />
          </div>
        </SecurityHandler>
      </RefProvider>
    </TenantProvider>
  );
};

export default StoreApp;
