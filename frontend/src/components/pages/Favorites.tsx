import React from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface FavoritesProps {
  userFiles: File[];
  getFileIcon: (filename: string) => React.ReactElement;
  handleFilePreview: (file: File) => void;
  handleFileDelete: (file: File, event: React.MouseEvent) => void;
  handleFileRename: (file: File, event: React.MouseEvent) => void;
}

const Favorites: React.FC<FavoritesProps> = ({
  userFiles,
  getFileIcon,
  handleFilePreview,
  handleFileDelete,
  handleFileRename
}) => {
  // Simulate some favorite files
  // In a real app, this would come from a backend or local storage
  const [favoriteFiles, setFavoriteFiles] = React.useState<File[]>([]);
  const [favoriteFileIds, setFavoriteFileIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Simulate some initial favorites (first 2 files if they exist)
    if (userFiles.length > 0) {
      const initialFavorites = userFiles.slice(0, Math.min(2, userFiles.length));
      setFavoriteFiles(initialFavorites);
      setFavoriteFileIds(new Set(initialFavorites.map(file => file.name + file.lastModified)));
    }
  }, [userFiles]);

  const toggleFavorite = (file: File, event: React.MouseEvent) => {
    event.stopPropagation();
    const fileId = file.name + file.lastModified;
    
    if (favoriteFileIds.has(fileId)) {
      // Remove from favorites
      setFavoriteFiles(prev => prev.filter(f => f.name + f.lastModified !== fileId));
      setFavoriteFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } else {
      // Add to favorites
      setFavoriteFiles(prev => [...prev, file]);
      setFavoriteFileIds(prev => new Set([...prev, fileId]));
    }
  };

  const handleRemoveFromFavorites = (file: File, event: React.MouseEvent) => {
    event.stopPropagation();
    const fileId = file.name + file.lastModified;
    setFavoriteFiles(prev => prev.filter(f => f.name + f.lastModified !== fileId));
    setFavoriteFileIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const getAccessFrequency = (file: File) => {
    // Simulate access frequency based on file characteristics
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'High';
    if (['jpg', 'png', 'gif'].includes(ext || '')) return 'Medium';
    return 'Low';
  };

  const getPriorityLevel = (file: File) => {
    const frequency = getAccessFrequency(file);
    const size = file.size;
    
    if (frequency === 'High' || size > 5 * 1024 * 1024) return 'high';
    if (frequency === 'Medium') return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-pink-600 to-pink-700 rounded-full"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-pink-800 bg-clip-text text-transparent tracking-wide">
            Favorites
          </h2>
          <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">
            {favoriteFiles.length} favorites
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <button className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200 transition-colors">
            Export Favorites
          </button>
          <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
            Share Collection
          </button>
          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
            Create Playlist
          </button>
        </div>
      </div>

      {/* All Files with Favorite Toggle */}
      {userFiles.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">All Files</h3>
            <p className="text-sm text-gray-600">Click the heart icon to add files to your favorites</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-pink-200 bg-pink-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-pink-700">Name</th>
                  <th className="p-4 text-sm font-semibold text-pink-700">Priority</th>
                  <th className="p-4 text-sm font-semibold text-pink-700">Access</th>
                  <th className="p-4 text-sm font-semibold text-pink-700">Size</th>
                  <th className="p-4 text-sm font-semibold text-pink-700">Favorite</th>
                </tr>
              </thead>
              <tbody>
                {userFiles.map((file) => {
                  const fileId = file.name + file.lastModified;
                  const isFavorite = favoriteFileIds.has(fileId);
                  const priority = getPriorityLevel(file);
                  const frequency = getAccessFrequency(file);
                  
                  return (
                    <tr
                      key={fileId}
                      className="border-b border-gray-200 hover:bg-pink-50 transition-colors cursor-pointer"
                      onClick={() => handleFilePreview(file)}
                    >
                      <td className="p-4 flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <span className="font-medium text-gray-700">{file.name}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{frequency}</td>
                      <td className="p-4 text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </td>
                      <td className="p-4">
                        <button
                          onClick={(e) => toggleFavorite(file, e)}
                          className="p-2 rounded-full hover:bg-pink-100 transition-colors"
                          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFavorite ? (
                            <FavoriteIcon sx={{ fontSize: 20, color: '#ec4899' }} />
                          ) : (
                            <FavoriteBorderIcon sx={{ fontSize: 20, color: '#6b7280' }} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Favorite Files */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Your Favorites</h3>
          <p className="text-sm text-gray-600">Files you've marked as favorites</p>
        </div>
        
        {favoriteFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FavoriteBorderIcon sx={{ fontSize: 32, color: '#ec4899' }} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No favorites yet</h3>
            <p className="text-gray-500">
              {userFiles.length === 0 
                ? "Upload some files and mark them as favorites to see them here"
                : "Mark some files as favorites to see them here"
              }
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteFiles.map((file) => {
              const priority = getPriorityLevel(file);
              const frequency = getAccessFrequency(file);
              
              return (
                <div
                  key={file.name + file.lastModified}
                  className="group relative bg-gradient-to-br from-pink-50 to-white border-2 border-pink-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleFilePreview(file)}
                >
                  {/* Priority Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </div>
                  
                  {/* Remove from Favorites */}
                  <button
                    onClick={(e) => handleRemoveFromFavorites(file, e)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-pink-200 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from favorites"
                  >
                    <FavoriteIcon sx={{ fontSize: 16, color: '#ec4899' }} />
                  </button>
                  
                  <div className="flex flex-col items-center text-center mt-4">
                    <div className="mb-3">
                      {getFileIcon(file.name)}
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1 truncate w-full" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-pink-600 font-medium">Access: {frequency}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => handleFileRename(file, e)}
                      className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;