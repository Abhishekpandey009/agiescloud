import React from 'react';
import { ArrowRight, Cloud, Zap, Shield } from 'lucide-react';

const Hero = () => {
  React.useEffect(() => {
    // Dynamically add Cedarville Cursive font from Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  return (
  <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

  <div className="relative max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-8 hover:bg-blue-200 transition-colors duration-200" data-aos="fade-down">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Cloud Storage
          </div>

          {/* Main Headline */}
          <h1
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight whitespace-nowrap flex items-center gap-3 justify-center text-center w-full"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
            data-aos="zoom-in"
          >
            <span>Hard</span>
            <span>drives</span>
            <span>have</span>
            <span className="relative inline-block">
              <span className="text-blue-600">trust</span>
              <svg
                className="absolute left-0 w-full h-2 -bottom-2"
                viewBox="0 0 100 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ pointerEvents: 'none' }}
              >
                <path
                  d="M5 7 Q 30 12, 60 7 Q 80 2, 95 7"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>issues</span>
            <span>!</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="200">
            AI-powered cloud storage that organizes, encrypts, and protects your files with care—your data, always secure and accessible.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" data-aos="fade-up" data-aos-delay="400">
            <button 
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
              {/* Watch Demo button removed as requested */}
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto" data-aos="fade-up" data-aos-delay="600">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Cloud className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">256-bit</div>
              <div className="text-sm text-gray-600">Encryption</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">10x</div>
              <div className="text-sm text-gray-600">Faster</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;