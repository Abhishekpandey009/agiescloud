import { useState, useEffect } from 'react';
import { Menu, X, Shield, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import AuthModal from './Auth/AuthModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // Remove authModal state since modal is not used for signup anymore

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Remove modal open/close handlers

  const navigate = useNavigate();
  const location = useLocation();

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
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
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
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AegisCloud
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
                {location.pathname === '/signup' ? (
                  <Link
                    to="/login"
                    replace
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                  >
                    Login
                  </Link>
                ) : location.pathname === '/login' ? (
                  <Link
                    to="/signup"
                    replace
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                )}
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Start Free Trial
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
              {/* <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Pricing</a> */}
              <hr className="my-4" />
              {isAuthenticated() ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {getUserName().charAt(0).toUpperCase()}
                </div>
              ) : (
                <>
                  {location.pathname === '/signup' ? (
                    <Link
                      to="/login"
                      replace
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-left"
                    >
                      Login
                    </Link>
                  ) : location.pathname === '/login' ? (
                    <Link
                      to="/signup"
                      replace
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-left"
                    >
                      Sign Up
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-left"
                    >
                      Sign Up
                    </Link>
                  )}
                  <Link 
                    to="/signup"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Start Free Trial
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