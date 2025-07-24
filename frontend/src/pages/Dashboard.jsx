import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument } from '../services/api';
import DocumentList from '../components/DocumentList';
import { toast } from 'react-toastify';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const fetchDocuments = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await getDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to fetch documents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (deletedId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== deletedId));
    // Toast notification is already handled in DocumentList component
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newDocument) => {
    setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    try {
      setUploading(true);
      const response = await uploadDocument(selectedFile);
      
      // Refresh documents list after successful upload
      const { data } = await getDocuments();
      setDocuments(data);
      
      setUploading(false);
      event.target.value = ''; // Reset file input
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    }
  };

  // Add these two handlers to fix the missing function errors
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile || null);
  };

  const handleUpload = async (event) => {
    if (!file) return;
    // Create a synthetic event object for handleFileUpload
    const syntheticEvent = { target: { files: [file], value: '' } };
    await handleFileUpload(syntheticEvent);
    setFile(null);
  };

  return (
    <div className="max-w-4xl p-4 mx-auto sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">Upload materials and start interacting with the AI.</p>
      
      <div className="mt-8">
        <div className="p-4 border-2 border-dashed rounded-md border-gray-300">
          <div className="flex flex-col items-center space-y-2">
            <input 
              id="file-upload-input" 
              type="file" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {loading ? (
          <p className="mt-4 text-center">Loading documents...</p>
        ) : (
          <DocumentList documents={documents} onDeleteDocument={handleDeleteDocument} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
