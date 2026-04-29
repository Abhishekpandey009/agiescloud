import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface TrashProps {
  userFiles: File[];
  getFileIcon: (filename: string) => React.ReactElement;
  handleFilePreview: (file: File) => void;
  handleFileDelete: (file: File, event: React.MouseEvent) => void;
}

interface DeletedFile {
  file: File;
  deletedDate: Date;
  originalPath: string;
  autoDeleteDate: Date;
}

const Trash: React.FC<TrashProps> = ({
  userFiles,
  getFileIcon,
  handleFilePreview
  // Note: handleFileDelete is intentionally not used in Trash as we have separate permanent delete functions
}) => {
  const [deletedFiles, setDeletedFiles] = React.useState<DeletedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set());
  const [showEmptyTrashModal, setShowEmptyTrashModal] = React.useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = React.useState(false);

  // Days until auto-delete
  const TRASH_RETENTION_DAYS = 30;

  React.useEffect(() => {
    // Simulate some deleted files
    if (userFiles.length > 0) {
      const mockDeletedFiles: DeletedFile[] = userFiles.slice(0, 3).map((file, index) => {
        const deletedDate = new Date(Date.now() - (index + 1) * 3 * 24 * 60 * 60 * 1000); // 3, 6, 9 days ago
        const autoDeleteDate = new Date(deletedDate.getTime() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        
        return {
          file,
          deletedDate,
          originalPath: `/Documents/${index % 2 === 0 ? 'Work' : 'Personal'}`,
          autoDeleteDate
        };
      });
      setDeletedFiles(mockDeletedFiles);
    }
  }, [userFiles]);

  const handleRestoreFile = (deletedFile: DeletedFile, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletedFiles(prev => prev.filter(df => df.file.name !== deletedFile.file.name));
    alert(`"${deletedFile.file.name}" has been restored to ${deletedFile.originalPath}`);
  };

  const handlePermanentDelete = (deletedFile: DeletedFile, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete "${deletedFile.file.name}"? This action cannot be undone.`)) {
      setDeletedFiles(prev => prev.filter(df => df.file.name !== deletedFile.file.name));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedFile.file.name);
        return newSet;
      });
      alert(`"${deletedFile.file.name}" has been permanently deleted.`);
    }
  };

  const handleSelectFile = (fileName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === deletedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(deletedFiles.map(df => df.file.name)));
    }
  };

  const handleRestoreSelected = () => {
    const filesToRestore = deletedFiles.filter(df => selectedFiles.has(df.file.name));
    if (filesToRestore.length === 0) return;

    const fileNames = filesToRestore.map(df => df.file.name).join(', ');
    if (confirm(`Restore ${filesToRestore.length} selected file(s)?`)) {
      setDeletedFiles(prev => prev.filter(df => !selectedFiles.has(df.file.name)));
      setSelectedFiles(new Set());
      alert(`${filesToRestore.length} file(s) have been restored: ${fileNames}`);
    }
  };

  const handleDeleteSelected = () => {
    const filesToDelete = deletedFiles.filter(df => selectedFiles.has(df.file.name));
    if (filesToDelete.length === 0) return;

    const fileNames = filesToDelete.map(df => df.file.name).join(', ');
    if (confirm(`Permanently delete ${filesToDelete.length} selected file(s)? This action cannot be undone.`)) {
      setDeletedFiles(prev => prev.filter(df => !selectedFiles.has(df.file.name)));
      setSelectedFiles(new Set());
      alert(`${filesToDelete.length} file(s) have been permanently deleted: ${fileNames}`);
    }
  };

  const handleEmptyTrash = () => {
    setShowEmptyTrashModal(true);
  };

  const confirmEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    
    // Simulate deletion process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDeletedFiles([]);
    setSelectedFiles(new Set());
    setIsEmptyingTrash(false);
    setShowEmptyTrashModal(false);
    alert('Trash has been emptied. All files have been permanently deleted.');
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

  const formatDaysLeft = (autoDeleteDate: Date) => {
    const now = new Date();
    const diffTime = autoDeleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getDaysLeftColor = (autoDeleteDate: Date) => {
    const now = new Date();
    const diffTime = autoDeleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return 'text-red-600 bg-red-100';
    if (diffDays <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-800 bg-clip-text text-transparent tracking-wide">
            Trash
          </h2>
        </div>
        
        <div className="flex gap-2">
          {selectedFiles.size > 0 && (
            <>
              <button
                onClick={handleRestoreSelected}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:scale-105 transition-all font-medium shadow-lg"
              >
                <RestoreIcon sx={{ fontSize: 18 }} />
                Restore ({selectedFiles.size})
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:scale-105 transition-all font-medium shadow-lg"
              >
                <DeleteForeverIcon sx={{ fontSize: 18 }} />
                Delete ({selectedFiles.size})
              </button>
            </>
          )}
          {deletedFiles.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:scale-105 transition-all font-medium shadow-lg"
            >
              <DeleteForeverIcon sx={{ fontSize: 18 }} />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <WarningIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">Files in trash are automatically deleted after 30 days</p>
            <p className="text-yellow-700">You can restore files before they're permanently deleted.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DeleteIcon sx={{ fontSize: 24, color: '#ef4444' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{deletedFiles.length}</p>
              <p className="text-sm text-gray-600">Files in trash</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AccessTimeIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {deletedFiles.filter(df => {
                  const now = new Date();
                  const diffTime = df.autoDeleteDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}
              </p>
              <p className="text-sm text-gray-600">Expiring soon</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon sx={{ fontSize: 24, color: '#3b82f6' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{selectedFiles.size}</p>
              <p className="text-sm text-gray-600">Selected files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {deletedFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DeleteIcon sx={{ fontSize: 32, color: '#6b7280' }} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Trash is empty</h3>
            <p className="text-gray-500">Deleted files will appear here and can be restored for 30 days</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === deletedFiles.length && deletedFiles.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">
                    Select all ({deletedFiles.length})
                  </span>
                </label>
              </div>
              
              <div className="text-sm text-gray-500">
                {selectedFiles.size > 0 
                  ? `${selectedFiles.size} of ${deletedFiles.length} selected`
                  : `${deletedFiles.length} files in trash`
                }
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-red-200 bg-red-50">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-red-700 w-12"></th>
                    <th className="p-4 text-sm font-semibold text-red-700">File</th>
                    <th className="p-4 text-sm font-semibold text-red-700">Original Location</th>
                    <th className="p-4 text-sm font-semibold text-red-700">Deleted</th>
                    <th className="p-4 text-sm font-semibold text-red-700">Auto-delete</th>
                    <th className="p-4 text-sm font-semibold text-red-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedFiles.map((deletedFile, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-red-50 transition-colors cursor-pointer"
                      onClick={() => handleFilePreview(deletedFile.file)}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(deletedFile.file.name)}
                          onChange={(e) => handleSelectFile(deletedFile.file.name, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        {getFileIcon(deletedFile.file.name)}
                        <div>
                          <span className="font-medium text-gray-700">{deletedFile.file.name}</span>
                          <p className="text-xs text-gray-500">
                            {(deletedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{deletedFile.originalPath}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                          {formatTimeAgo(deletedFile.deletedDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysLeftColor(deletedFile.autoDeleteDate)}`}>
                          {formatDaysLeft(deletedFile.autoDeleteDate)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleRestoreFile(deletedFile, e)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors font-medium"
                            title="Restore file"
                          >
                            <RestoreIcon sx={{ fontSize: 14 }} />
                          </button>
                          <button
                            onClick={(e) => handlePermanentDelete(deletedFile, e)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium"
                            title="Delete permanently"
                          >
                            <DeleteForeverIcon sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Empty Trash Confirmation Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <WarningIcon sx={{ fontSize: 32, color: '#ef4444' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Empty Trash?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                You're about to permanently delete <strong>{deletedFiles.length} file(s)</strong> from your trash.
              </p>
              <p className="text-sm text-red-600">
                These files will be gone forever and cannot be recovered.
              </p>
            </div>
            
            {isEmptyingTrash ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Emptying trash...</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmptyTrashModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  <CancelIcon sx={{ fontSize: 16, marginRight: 1 }} />
                  Cancel
                </button>
                <button
                  onClick={confirmEmptyTrash}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  <DeleteForeverIcon sx={{ fontSize: 16, marginRight: 1 }} />
                  Empty Trash
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trash;