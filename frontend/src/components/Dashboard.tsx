import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import MovieIcon from '@mui/icons-material/Movie';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import React from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";



// Removed unused imports

const Dashboard: React.FC = () => {
  // Helper to get icon component based on file extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ fontSize: 32, color: '#e53935' }} />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon sx={{ fontSize: 32, color: '#1976d2' }} />;
      case 'xls':
      case 'xlsx':
        return <TableChartIcon sx={{ fontSize: 32, color: '#388e3c' }} />;
      case 'ppt':
      case 'pptx':
        return <SlideshowIcon sx={{ fontSize: 32, color: '#fbc02d' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon sx={{ fontSize: 32, color: '#8e24aa' }} />;
      case 'mp3':
      case 'wav':
        return <AudiotrackIcon sx={{ fontSize: 32, color: '#6d4c41' }} />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <MovieIcon sx={{ fontSize: 32, color: '#0288d1' }} />;
      case 'zip':
      case 'rar':
        return <FolderZipIcon sx={{ fontSize: 32, color: '#ffa000' }} />;
      default:
        return <InsertDriveFileIcon sx={{ fontSize: 32, color: '#90a4ae' }} />;
    }
  };


  // Ref for hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [userFiles, setUserFiles] = React.useState<File[]>([]);
  const [frequentFiles, setFrequentFiles] = React.useState<File[]>([]);

  // Handler to trigger file input
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handler for file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Add uploaded files to userFiles
      setUserFiles(prev => [...prev, ...Array.from(files)]);
      // For demo, treat all uploaded files as frequent
      setFrequentFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const isNewUser = userFiles.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900 font-sans">
      {/* Main Content Only */}
  <main className="bg-white p-8 pt-24">
        <h2
          className="text-3xl font-bold tracking-tight text-[#6366F1] mb-8"
          style={{ fontFamily: 'Cedarville Cursive, cursive' }}
        >
          Home
        </h2>
        {/* Quick Access */}
        <section>
          <h3
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: 'Cedarville Cursive, cursive' }}
          >
            Quick Access
          </h3>
          {isNewUser ? (
            <div className="text-gray-500 text-base py-8 text-center">
              Your frequently accessed files are shown here!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {frequentFiles.map((file) => (
                <div key={file.name + file.lastModified} className="bg-blue-50 rounded-md overflow-hidden group shadow hover:shadow-lg transition-shadow">
                  <div className="h-32 flex items-center justify-center bg-cover bg-center">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="p-4">
                    <p className="text-base font-medium">{file.name}</p>
                    <p className="text-gray-500 text-sm">Uploaded {new Date(file.lastModified).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Recent Files */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-xl font-semibold"
              style={{ fontFamily: 'Cedarville Cursive, cursive' }}
            >
              Recent Files
            </h3>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 bg-blue-100 text-[#6366F1] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                onClick={handleUploadClick}
              >
                <UploadFileIcon sx={{ color: '#6366F1' }} />
                Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={handleFileChange}
              />
              <button
                className="flex items-center gap-2 bg-blue-100 text-[#6366F1] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <CreateNewFolderIcon sx={{ color: '#6366F1' }} />
                New Folder
              </button>
            </div>
          </div>
          {isNewUser ? (
            <div className="flex flex-col items-center justify-center py-16">
              <img
                src="/dashboard.png"
                alt="No files illustration"
                className="w-[400px] h-[260px] object-contain mb-4"
              />
              <div className="text-gray-500 text-base text-center">
                You haven't uploaded any files yet!
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-blue-100">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-500">Name</th>
                    <th className="p-4 text-sm font-semibold text-gray-500">Uploaded</th>
                    <th className="p-4 text-sm font-semibold text-gray-500">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {userFiles.map((file) => (
                    <tr key={file.name + file.lastModified} className="border-b border-blue-100 hover:bg-blue-100/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <span className="font-medium">{file.name}</span>
                      </td>
                      <td className="p-4 text-gray-500">{new Date(file.lastModified).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
