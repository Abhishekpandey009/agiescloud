// ...existing code...
import { Shield, X, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Aegis
                </span>
                <span className="text-2xl font-light text-slate-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Cloud
                </span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-md">
              Secure, intelligent cloud storage powered by AI. Store, organize, and access your files with military-grade security and lightning-fast performance.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors duration-200 group">
                <X className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors duration-200 group">
                <Github className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors duration-200 group">
                <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors duration-200 group">
                <Mail className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Product</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Security</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">API</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Integrations</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Press</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-slate-800 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500">
              © 2024 AegisCloud. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-slate-800 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-slate-800 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-slate-800 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;