import { useState } from 'react';
import { Check, Star, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Personal',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for individual users getting started',
    features: [
      '10 GB storage',
      'Basic file sharing',
      'Mobile & web apps',
      'Email support',
      'Basic AI features'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: { monthly: 12, yearly: 120 },
    description: 'Ideal for power users and small teams',
    features: [
      '1 TB storage',
      'Advanced sharing & permissions',
      'Priority support',
      'Full AI suite',
      'Version history',
      'Advanced encryption',
      'Team collaboration'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Business',
    price: { monthly: 24, yearly: 240 },
    description: 'For growing businesses and larger teams',
    features: [
      'Unlimited storage',
      'Advanced admin controls',
      'SSO integration',
      'Compliance tools',
      'Custom branding',
      'API access',
      '24/7 phone support',
      'Advanced analytics'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your needs. All plans include our core features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-xl p-1 shadow-lg">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                !isYearly ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isYearly ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setIsYearly(true)}
            >
              Yearly
              <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            
            return (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-blue-600 scale-105' : 'hover:scale-105'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        ${price}
                      </span>
                      <span className="text-gray-500 ml-2">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {isYearly && price > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-2">
                        Save ${(plan.price.monthly * 12) - plan.price.yearly} per year
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-yellow-500 mr-2" />
              <h3 className="text-2xl font-bold text-gray-900">Need Something Custom?</h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Looking for enterprise features, custom storage limits, or special compliance requirements? 
              We'll create a plan that fits your exact needs.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200">
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;