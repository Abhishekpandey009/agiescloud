// ...existing code...

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Security from './components/Security';
import AIFeatures from './components/AIFeatures';
import Footer from './components/Footer';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';


import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Dashboard from './components/Dashboard';
import AIDashboard from './components/AIDashboard';
import ChatBot from './components/ChatBot';
import ChatBox from './components/ChatBox';

function FooterWrapper() {
  const location = useLocation();
  const hiddenRoutes = ['/dashboard'];
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on mount and set up listener
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      setIsLoggedIn(Boolean(token));
    };

    // Check initial auth status
    checkAuth();

    // Listen for storage changes (when user logs in/out in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userToken') {
        checkAuth();
      }
    };

    // Listen for custom login/logout events (for same-tab login/logout)
    const handleLoginEvent = () => {
      checkAuth();
    };

    const handleLogoutEvent = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleLoginEvent);
    window.addEventListener('userLoggedOut', handleLogoutEvent);
    
    // Check less frequently to avoid performance issues
    const authCheckInterval = setInterval(checkAuth, 30000); // Check every 30 seconds instead of 1 second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
      window.removeEventListener('userLoggedOut', handleLogoutEvent);
      clearInterval(authCheckInterval);
    };
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
    });
  }, []);

  // Check login status - look for either 'token' or 'userToken'
  // const isLoggedIn = Boolean(localStorage.getItem('token') || localStorage.getItem('userToken'));

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={
            isLoggedIn ? <Dashboard /> : <>
              <Header />
              <Hero />
              <Features />
              <AIFeatures />
              <Security />
            </>
          } />
          <Route path="/dashboard" element={
            isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/ai" element={
            isLoggedIn ? <AIDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/ai/chat" element={
            isLoggedIn ? <ChatBot /> : <Navigate to="/login" replace />
          } />
          <Route path="/ai/hf-chat" element={
            isLoggedIn ? <ChatBox /> : <Navigate to="/login" replace />
          } />
          <Route path="/signup" element={
            <>
              <Header />
              <SignupPage />
            </>
          } />
          <Route path="/login" element={
            <>
              <Header />
              <LoginPage goToSignup={() => {}} />
            </>
          } />
        </Routes>
        <FooterWrapper />
      </div>
    </Router>
  );
}

export default App;