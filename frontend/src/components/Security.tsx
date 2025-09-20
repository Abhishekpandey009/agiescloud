import { Shield, Lock, Key, Eye, Server } from 'lucide-react';

const securityFeatures = [
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'AES-256 encryption ensures your data is protected both in transit and at rest.',
  },
  {
    icon: Key,
    title: 'Zero-Knowledge Architecture',
    description: 'We never have access to your unencrypted data or passwords.',
  },
  {
    icon: Eye,
    title: 'Private by Design',
    description: 'Your files are encrypted before leaving your device.',
  },
  {
    icon: Server,
    title: 'Secure Infrastructure',
    description: 'Built on enterprise-grade cloud infrastructure with 24/7 monitoring.',
  }
];

const certifications = [
  { name: 'SOC 2 Type II', logo: '🛡️' },
  { name: 'ISO 27001', logo: '🔐' },
  { name: 'GDPR Compliant', logo: '🇪🇺' },
  { name: 'HIPAA Ready', logo: '⚕️' }
];

const Security = () => {
  return (
    <section id="security" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900" data-aos="fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Military-Grade Security
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 flex flex-wrap items-center justify-center gap-3 w-full"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
          >
            <span>Your</span>
            <span>Data</span>
            <span>is</span>
            <span className="relative inline-block">
              <span className="text-blue-600">Fort Knox Secure</span>
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
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We take security seriously. Your data is protected by multiple layers of enterprise-grade security measures.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Encryption Visualization */}
  <div className="bg-white rounded-3xl p-8 md:p-12 mb-20 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3
                className="text-3xl font-bold mb-6 text-gray-900 flex flex-wrap items-center justify-center gap-3 w-full"
                style={{ fontFamily: 'Cedarville Cursive, cursive' }}
              >
                <span>How</span>
                <span>Your</span>
                <span>Data</span>
                <span>Stays</span>
                <span>Protected</span>
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Client-Side Encryption</h4>
                    <p className="text-gray-600">Files are encrypted on your device before upload using AES-256 encryption.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Secure Transmission</h4>
                    <p className="text-gray-600">Data travels through TLS 1.3 encrypted channels to our servers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Zero-Knowledge Storage</h4>
                    <p className="text-gray-600">Files remain encrypted at rest. Only you have the keys to decrypt them.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 border border-blue-100">
                <div className="text-center">
                  <Lock className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                  <div className="text-2xl font-bold mb-2 text-gray-900">256-bit AES Encryption</div>
                  <div className="text-gray-600">The same encryption used by banks and governments</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center">
          <h3
            className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 flex flex-wrap items-center justify-center gap-2 w-full"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
          >
            <span className="relative inline-block">
              <span className="text-blue-600">Trusted</span>
              <svg
                viewBox="0 0 100 10"
                className="absolute left-0 bottom-0 w-full h-2"
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 25 2, 50 8 Q 75 14, 98 2"
                  stroke="#2563eb"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
            <span>&amp;</span>
            <span>Certified!</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 hover:bg-blue-50 transition-colors duration-300">
                <div className="text-4xl mb-4">{cert.logo}</div>
                <div className="font-semibold text-sm text-gray-900">{cert.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;