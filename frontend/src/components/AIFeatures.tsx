// import { useState } from 'react';
import { Brain, Search, ImageIcon, FileText, Tags, BarChart3 } from 'lucide-react';

const aiFeatures = [
  {
    id: 'smart-organize',
    icon: Brain,
    title: 'Smart Organization',
    description: 'AI automatically categorizes and organizes your files based on content, type, and usage patterns.',
    details: 'Our advanced machine learning algorithms analyze your files and create intelligent folder structures, making it easier to find what you need.'
  },
  {
    id: 'content-search',
    icon: Search,
    title: 'Intelligent Search',
    description: 'Find any file instantly with natural language search that understands context and content.',
    details: 'Search for "photos from last vacation" or "contract with John" and get exactly what you need, even if those words aren\'t in the filename.'
  },
  {
    id: 'image-recognition',
    icon: ImageIcon,
    title: 'Image Recognition',
    description: 'Automatically tag and categorize images based on their content, people, and objects.',
    details: 'Find all photos of your dog, sunset pictures, or documents containing charts without manual tagging.'
  },
  {
    id: 'document-analysis',
    icon: FileText,
    title: 'Document Analysis',
    description: 'Extract key information from documents and PDFs for better organization and searchability.',
    details: 'AI reads your documents to extract names, dates, topics, and creates searchable metadata automatically.'
  },
  {
    id: 'auto-tagging',
    icon: Tags,
    title: 'Auto-Tagging',
    description: 'Smart tagging system that learns from your behavior and automatically applies relevant tags.',
    details: 'The system learns how you organize files and automatically applies consistent tags based on your preferences.'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Get insights into your storage usage, file access patterns, and collaboration statistics.',
    details: 'Understand which files are most important to you and optimize your storage organization accordingly.'
  }
];

const AIFeatures = () => {

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50" data-aos="fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-6">
            <Brain className="w-4 h-4 mr-2" />
            Powered by AI
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 flex flex-wrap items-center justify-center gap-3 w-full"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
          >
            <span>Intelligence</span>
            <span>that</span>
            <span className="relative inline-block">
              <span className="text-blue-600">Works for You</span>
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
            Experience the power of artificial intelligence working behind the scenes to make your cloud storage smarter and more efficient.
          </p>
        </div>

        {/* Redesigned grid of feature cards covering the section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="relative group p-8 rounded-3xl backdrop-blur-lg border-2 border-transparent shadow-xl bg-white/70 hover:bg-white transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden h-full min-h-[260px]"
                style={{ boxShadow: '0 8px 32px 0 rgba(60, 80, 180, 0.10)' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-blue-400 shadow-lg mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
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

export default AIFeatures;