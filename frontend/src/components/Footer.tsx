// ...existing code...
import { Shield, Twitter, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AegisCloud</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md text-sm">
              Secure, intelligent cloud storage powered by AI. Store, organize, and access your files with military-grade security and lightning-fast performance.
            </p>
            <div className="flex space-x-2">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Product</h4>
            <nav className="space-y-1 text-sm">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Features</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Security</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Pricing</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">API</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Integrations</a>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <nav className="space-y-1 text-sm">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">About</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Blog</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Careers</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Press</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors duration-200">Contact</a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs">
            <div className="text-gray-400 mb-2 md:mb-0">
              © 2024 AegisCloud. All rights reserved.
            </div>
            <nav className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;