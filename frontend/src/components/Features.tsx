// ...existing code...
import { Cloud, Lock, Zap, Users, Smartphone, Globe } from 'lucide-react';

const features = [
  {
    icon: Cloud,
    title: 'Unlimited Storage',
    description: 'Store all your files, photos, and documents without worrying about space limits.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Lock,
    title: 'Advanced Security',
    description: 'Military-grade encryption and zero-knowledge architecture protect your data.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Upload and access your files at blazing speeds with our global CDN.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share files and collaborate with your team in real-time with advanced permissions.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform',
    description: 'Access your files from any device with native apps for all platforms.',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access your data from anywhere in the world with 99.9% uptime guarantee.',
    color: 'from-indigo-500 to-indigo-600'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white" data-aos="fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 flex flex-wrap items-center justify-center gap-3 w-full"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
          >
            <span>Everything</span>
            <span>You</span>
            <span>Need</span>
            <span>in</span>
            <span className="relative inline-block">
              <span className="text-blue-600">One Platform</span>
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
            Discover powerful features that make AegisCloud the perfect solution for individuals and teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative group p-8 rounded-3xl backdrop-blur-lg border-2 border-transparent shadow-xl bg-white/70 hover:bg-white transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden h-full min-h-[260px]"
                style={{ boxShadow: '0 8px 32px 0 rgba(60, 80, 180, 0.10)' }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm mb-2">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;