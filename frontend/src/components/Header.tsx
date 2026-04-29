import { useState } from 'react';
import { Menu, X, Shield, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import AuthModal from './Auth/AuthModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Removed isScrolled and scroll effect: header is always solid and sticky


  // Remove modal open/close handlers

  const navigate = useNavigate();

  // Placeholder authentication check
  const isAuthenticated = () => {
    return Boolean(localStorage.getItem('userToken'));
  };

  // Get user's name (replace with real logic as needed)
  const getUserName = () => {
    const user = localStorage.getItem('userName');
    if (user && user.trim().length > 0) {
      return user.trim();
    }
    return 'User';
  };

  const handleLogoClick = () => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className="fixed w-full z-[60] bg-white border-b border-[#23264a] shadow-lg transition-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button
            className="flex items-center space-x-2 focus:outline-none"
            onClick={handleLogoClick}
            aria-label="Go to home or dashboard"
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl  font-bold tracking-tight text-slate-800" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.025em' }}>
                  Aegis
                </span>
                <span className="text-2xl font-light text-slate-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Cloud
                </span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              Features
            </a>
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Solutions
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
            </div>
            <a href="#security" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              Security
            </a>
            {isAuthenticated() && (
              <Link to="/ai" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                AI Insights
              </Link>
            )}
            {/* <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              Pricing
            </a> */}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated() ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {getUserName().charAt(0).toUpperCase()}
              </div>
            ) : (
              <>
                {/* Left link: Sign Up (text link) */}
                <Link
                  to="/signup"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
                {/* Primary CTA: Login button */}
                <Link 
                  to="/login"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 bg-white/95 backdrop-blur-md rounded-lg mt-2 shadow-xl">
            <nav className="flex flex-col space-y-4 px-4">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Features</a>
              <a href="#security" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Security</a>
              {isAuthenticated() && (
                <Link to="/ai" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">AI Insights</Link>
              )}
              {/* <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Pricing</a> */}
              <hr className="my-4" />
              {isAuthenticated() ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {getUserName().charAt(0).toUpperCase()}
                </div>
              ) : (
                <>
                  {/* Mobile: text link Sign Up */}
                  <Link
                    to="/signup"
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-left"
                  >
                    Sign Up
                  </Link>
                  {/* Mobile primary CTA: Login */}
                  <Link 
                    to="/login"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium text-center"
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
      </header>

      {/* AuthModal removed, routing used instead */}
    </>
  );
};

export default Header;