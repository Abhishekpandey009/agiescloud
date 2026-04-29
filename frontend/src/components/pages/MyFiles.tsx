import React from 'react';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

// Types for backend file objects
interface BackendFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  lastModified: string;
  isFavorite: boolean;
  tags: string[];
  metadata: any;
}

interface MyFilesProps {
  userFiles: BackendFile[];
  filteredFiles: BackendFile[];
  getFileIcon: (filename: string) => React.ReactElement;
  handleFilePreview: (file: BackendFile) => void;
  handleFileDelete: (file: BackendFile, event: React.MouseEvent) => void;
  handleFileRename: (file: BackendFile, event: React.MouseEvent) => void;
  clearSearch: () => void;
}

const MyFiles: React.FC<MyFilesProps> = ({
  userFiles,
  filteredFiles,
  getFileIcon,
  handleFilePreview,
  handleFileDelete,
  handleFileRename,
  clearSearch
}) => {
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Sorting functionality
  const sortedFiles = React.useMemo(() => {
    const sorted = [...filteredFiles].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'date':
          comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(); // Newer first by default
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          const extA = a.originalName.split('.').pop()?.toLowerCase() || '';
          const extB = b.originalName.split('.').pop()?.toLowerCase() || '';
          comparison = extA.localeCompare(extB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredFiles, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      alert(`Folder "${folderName.trim()}" would be created in My Files`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-green-700 rounded-full"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent tracking-wide">
            My Files
          </h2>
          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {userFiles.length} files
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:scale-105 transition-all font-medium shadow-lg"
          >
            <CreateNewFolderIcon sx={{ fontSize: 18 }} />
            New Folder
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        <div className="flex gap-2">
          {[
            { key: 'name', label: 'Name' },
            { key: 'date', label: 'Date' },
            { key: 'size', label: 'Size' },
            { key: 'type', label: 'Type' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key as 'name' | 'date' | 'size' | 'type')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                sortBy === key
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-transparent'
              }`}
            >
              {label}
              {sortBy === key && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Files Display */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {sortedFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <InsertDriveFileIcon sx={{ fontSize: 32, color: '#16a34a' }} />
            </div>
            {userFiles.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No files yet</h3>
                <p className="text-gray-500">Start by uploading your first file</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No matching files</h3>
                <p className="text-gray-500 mb-3">
                  No files match your current search or filter criteria.
                </p>
                <button 
                  onClick={clearSearch}
                  className="text-green-600 hover:text-green-800 underline font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-green-200 bg-green-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-green-700">Name</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Modified</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Size</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Type</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map((file) => (
                  <tr
                    key={file._id}
                    className="border-b border-gray-200 hover:bg-green-50 transition-colors cursor-pointer"
                    onClick={() => handleFilePreview(file)}
                  >
                    <td className="p-4 flex items-center gap-3">
                      {getFileIcon(file.originalName)}
                      <span className="font-medium text-gray-700">{file.originalName}</span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="p-4 text-gray-500">
                      {file.originalName.split('.').pop()?.toUpperCase() || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleFileRename(file, e)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          title="Rename file"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleFileDelete(file, e)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="Delete file"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sortedFiles.map((file) => (
              <div
                key={file._id}
                className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleFilePreview(file)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3">
                    {getFileIcon(file.originalName)}
                  </div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 truncate w-full" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                
                {/* Hover Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => handleFileRename(file, e)}
                    className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleFileDelete(file, e)}
                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFiles;