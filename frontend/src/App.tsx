// ...existing code...

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Security from './components/Security';
import AIFeatures from './components/AIFeatures';
// import Pricing from './components/Pricing';
// import Demo from './components/Demo';
import Footer from './components/Footer';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';


import { useEffect } from 'react';

import Dashboard from './components/Dashboard';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
    });
  }, []);

  // Check login status
  const isLoggedIn = Boolean(localStorage.getItem('userToken'));

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              isLoggedIn ? <Dashboard /> : <>
                <Hero />
                <Features />
                <AIFeatures />
                <Security />
                {/* <Demo /> */}
                {/* <Pricing /> */}
              </>
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage onLogin={() => false} goToSignup={() => {}} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;