import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RefProvider } from '../contexts/RefContext'; // 👈 IMPORTANTE
import Header from './components/StoreHeader';
import BasicFooter from '../components/BasicFooter';
import GlobalCartTimer from './components/GlobalCartTimer';

import Event from './pages/Event';
import EventsVenue from './pages/EventsVenue';
import EventInfo from './pages/EventInfo';
import EventMap from './pages/EventMap';
import BuyEvent from './pages/BuyEvent';
import SelectSeats from './pages/SelectSeats';
import CartPage from './pages/CartPage'; // 👈 agrega esta línea arriba
import Pay from './pages/Pay';
import FaqPage from './pages/FaqPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import NotFoundPage from './pages/NotFoundPage';
import StoreLogin from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EventSearchMap from './pages/EventSearchMap';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/profile';
import EventosPage from './pages/EventosPage';
import EventosMapPage from './pages/EventosMapPage';
import ThankYouPage from './pages/ThankYouPage';
import { useAuth } from '../contexts/AuthContext'; // para perfil

const StoreApp = () => {
  const location = useLocation();
  const { user, updateProfile } = useAuth();

  const showHeader =
    location.pathname.startsWith('/store') ||
    location.pathname.startsWith('/payment-success');
  const showFooter = location.pathname.startsWith('/store');

  return (
    <RefProvider> {/* 👈 ENVOLVER AQUÍ */}
        <div className="min-h-screen flex flex-col">
          {showHeader && <Header />}
          <div className="flex-grow">
            <Routes>
              <Route path="/store" element={<EventsVenue groupByTags={false} />} />
              <Route path="/store/tag/:tagSlug?" element={<EventsVenue groupByTags />} />
              <Route path="/store/eventos/:eventSlug" element={<EventosPage />} />
              <Route path="/store/eventos/:eventSlug/map" element={<EventosMapPage />} />
              <Route path="/store/event/:eventId" element={<EventInfo />} />
              <Route path="/store/event/:eventId/map" element={<EventMap />} />
              <Route path="/store/event/:eventId/full" element={<Event />} />
              <Route path="/store/buy-event/:id" element={<BuyEvent />} />
              <Route path="/store/select-seats/:salaId" element={<SelectSeats />} />
              <Route path="/store/select-seats/:salaId/:funcionId" element={<SelectSeats />} />
              <Route path="/store/seat-selection/:funcionId" element={<SeatSelectionPage />} />
              <Route path="/store/cart" element={<CartPage />} />
              <Route path="/store/payment" element={<Pay />} />
              <Route path="/store/login" element={<StoreLogin />} />
              <Route path="/store/register" element={<Register />} />
              <Route path="/store/forgot-password" element={<ForgotPassword />} />
              <Route path="/store/reset-password" element={<ResetPassword />} />
              <Route path="/store/search-map" element={<EventSearchMap />} />
              <Route path="/store/faq" element={<FaqPage />} />
              <Route path="/store/perfil" element={<Profile userData={user} onUpdateProfile={updateProfile} />} />
              <Route path="/payment-success/:locator?" element={<PaymentSuccess />} />
              <Route path="/thank-you" element={<ThankYouPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </div>
          {showFooter && <BasicFooter />}
          <GlobalCartTimer />
        </div>
    </RefProvider>
  );
};

export default StoreApp;
