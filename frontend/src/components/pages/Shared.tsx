import React from 'react';
import ShareIcon from '@mui/icons-material/Share';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import LinkIcon from '@mui/icons-material/Link';
import MailIcon from '@mui/icons-material/Mail';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface SharedProps {
  userFiles: File[];
  getFileIcon: (filename: string) => React.ReactElement;
  handleFilePreview: (file: File) => void;
  handleFileDelete: (file: File, event: React.MouseEvent) => void;
}

interface SharedFile {
  file: File;
  sharedBy: string;
  sharedWith: string[];
  shareDate: Date;
  permissions: 'view' | 'edit' | 'download';
  isPublic: boolean;
}

const Shared: React.FC<SharedProps> = ({
  userFiles,
  getFileIcon,
  handleFilePreview,
  handleFileDelete
}) => {
  // Simulate shared files
  const [sharedWithMe, setSharedWithMe] = React.useState<SharedFile[]>([]);
  const [sharedByMe, setSharedByMe] = React.useState<SharedFile[]>([]);

  React.useEffect(() => {
    // Simulate some shared files
    if (userFiles.length > 0) {
      const mockSharedWithMe: SharedFile[] = userFiles.slice(0, 2).map((file, index) => ({
        file,
        sharedBy: index === 0 ? 'john.doe@company.com' : 'sarah.wilson@team.com',
        sharedWith: ['me@company.com'],
        shareDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        permissions: index === 0 ? 'edit' : 'view',
        isPublic: false
      }));

      const mockSharedByMe: SharedFile[] = userFiles.slice(2, 4).map((file, index) => ({
        file,
        sharedBy: 'me@company.com',
        sharedWith: index === 0 
          ? ['team@company.com', 'manager@company.com'] 
          : ['client@external.com'],
        shareDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        permissions: 'view',
        isPublic: index === 1
      }));

      setSharedWithMe(mockSharedWithMe);
      setSharedByMe(mockSharedByMe);
    }
  }, [userFiles]);

  const handleShareFile = (file: File, event: React.MouseEvent) => {
    event.stopPropagation();
    const email = prompt('Enter email address to share with:');
    if (email && email.trim()) {
      alert(`File "${file.name}" would be shared with ${email.trim()}`);
    }
  };

  const handleGenerateLink = (file: File, event: React.MouseEvent) => {
    event.stopPropagation();
    const link = `https://aegiscloud.com/shared/${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    navigator.clipboard.writeText(link);
    alert(`Share link copied to clipboard:\n${link}`);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'edit': return 'text-green-600 bg-green-100';
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'download': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-indigo-700 rounded-full"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-800 bg-clip-text text-transparent tracking-wide">
            Shared Files
          </h2>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:scale-105 transition-all font-medium shadow-lg">
          <ShareIcon sx={{ fontSize: 18 }} />
          Share New File
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PersonIcon sx={{ fontSize: 24, color: '#3b82f6' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{sharedWithMe.length}</p>
              <p className="text-sm text-gray-600">Shared with me</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShareIcon sx={{ fontSize: 24, color: '#10b981' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{sharedByMe.length}</p>
              <p className="text-sm text-gray-600">Shared by me</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LinkIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {sharedByMe.filter(s => s.isPublic).length}
              </p>
              <p className="text-sm text-gray-600">Public links</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shared with Me */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Shared with Me</h3>
          <p className="text-sm text-gray-600">Files others have shared with you</p>
        </div>
        
        {sharedWithMe.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PersonIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No shared files</h3>
            <p className="text-gray-500">Files shared with you will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-indigo-200 bg-indigo-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-indigo-700">File</th>
                  <th className="p-4 text-sm font-semibold text-indigo-700">Shared By</th>
                  <th className="p-4 text-sm font-semibold text-indigo-700">Permission</th>
                  <th className="p-4 text-sm font-semibold text-indigo-700">Shared</th>
                  <th className="p-4 text-sm font-semibold text-indigo-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sharedWithMe.map((sharedFile, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => handleFilePreview(sharedFile.file)}
                  >
                    <td className="p-4 flex items-center gap-3">
                      {getFileIcon(sharedFile.file.name)}
                      <div>
                        <span className="font-medium text-gray-700">{sharedFile.file.name}</span>
                        <p className="text-xs text-gray-500">
                          {(sharedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <PersonIcon sx={{ fontSize: 14, color: '#4f46e5' }} />
                        </div>
                        <span className="text-sm text-gray-700">{sharedFile.sharedBy}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(sharedFile.permissions)}`}>
                        {sharedFile.permissions.charAt(0).toUpperCase() + sharedFile.permissions.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        {formatTimeAgo(sharedFile.shareDate)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleGenerateLink(sharedFile.file, e)}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                          title="Copy link"
                        >
                          🔗
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared by Me */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Shared by Me</h3>
          <p className="text-sm text-gray-600">Files you've shared with others</p>
        </div>
        
        {sharedByMe.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShareIcon sx={{ fontSize: 32, color: '#10b981' }} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No shared files</h3>
            <p className="text-gray-500 mb-4">Start sharing files with your team</p>
            {userFiles.length > 0 && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Share Your First File
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-green-200 bg-green-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-green-700">File</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Shared With</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Permission</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Status</th>
                  <th className="p-4 text-sm font-semibold text-green-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sharedByMe.map((sharedFile, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-green-50 transition-colors cursor-pointer"
                    onClick={() => handleFilePreview(sharedFile.file)}
                  >
                    <td className="p-4 flex items-center gap-3">
                      {getFileIcon(sharedFile.file.name)}
                      <div>
                        <span className="font-medium text-gray-700">{sharedFile.file.name}</span>
                        <p className="text-xs text-gray-500">
                          Shared {formatTimeAgo(sharedFile.shareDate)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {sharedFile.sharedWith.length > 1 ? (
                          <GroupIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : (
                          <PersonIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        )}
                        <div className="text-sm">
                          {sharedFile.sharedWith.length === 1 
                            ? sharedFile.sharedWith[0]
                            : `${sharedFile.sharedWith.length} recipients`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(sharedFile.permissions)}`}>
                        {sharedFile.permissions.charAt(0).toUpperCase() + sharedFile.permissions.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      {sharedFile.isPublic ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                          Public Link
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                          Private
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleShareFile(sharedFile.file, e)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          title="Share with more"
                        >
                          <MailIcon sx={{ fontSize: 12 }} />
                        </button>
                        <button
                          onClick={(e) => handleGenerateLink(sharedFile.file, e)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                          title="Copy link"
                        >
                          🔗
                        </button>
                        <button
                          onClick={(e) => handleFileDelete(sharedFile.file, e)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="Stop sharing"
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Share Section */}
      {userFiles.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Share</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userFiles.slice(0, 3).map((file) => (
              <div
                key={file.name + file.lastModified}
                className="bg-white rounded-xl p-4 border border-indigo-200 hover:border-indigo-300 transition-all cursor-pointer"
                onClick={() => handleFilePreview(file)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-700 truncate">{file.name}</h4>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleShareFile(file, e)}
                    className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick={(e) => handleGenerateLink(file, e)}
                    className="flex-1 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
                  >
                    Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shared;