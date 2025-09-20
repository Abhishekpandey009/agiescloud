import React, { useState } from 'react';
import { Upload, File, Image, Video, Music, Check } from 'lucide-react';

type UploadedFile = {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | string;
  status: 'uploading' | 'complete';
};

const Demo = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file upload
    const newFile: UploadedFile = {
      id: Date.now(),
      name: 'demo-file.pdf',
      size: '2.4 MB',
      type: 'pdf',
      status: 'uploading'
    };
    setUploadedFiles(prev => [...prev, newFile]);

    // Simulate upload completion
    setTimeout(() => {
      setUploadedFiles(prev =>
        prev.map(file =>
          file.id === newFile.id ? { ...file, status: 'complete' } : file
        )
      );
    }, 2000);
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'pdf': return <File className="w-5 h-5 text-red-500" />;
      case 'image': return <Image className="w-5 h-5 text-green-500" />;
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Try It
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Yourself</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of AegisCloud with our interactive demo. Upload files and see how our AI works its magic.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Drop files here to upload
                </h3>
                <p className="text-gray-600 mb-6">
                  Or click to select files from your computer
                </p>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Choose Files
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">AI Features in Action:</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Smart categorization and tagging
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Content analysis and indexing
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Automatic duplicate detection
                  </div>
                </div>
              </div>
            </div>

            {/* File List */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Uploads</h3>
              
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No files uploaded yet. Try dropping a file above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {file.status === 'uploading' && (
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {file.status === 'complete' && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="font-semibold text-gray-900">2.4 GB of 100 GB</span>
                </div>
                <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-1/12 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;