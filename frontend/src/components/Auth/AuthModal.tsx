import React from 'react';
import { X } from 'lucide-react';
import Login from './Login';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {

  if (!isOpen) return null;

  const handleSwitchToSignup = () => {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal content */}
        <div className="relative inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-3xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Auth content */}
          <div className="p-0">
            <Login onSwitchToSignup={handleSwitchToSignup} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;