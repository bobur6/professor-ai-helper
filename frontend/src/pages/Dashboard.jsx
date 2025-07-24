import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument } from '../services/api';
import DocumentList from '../components/DocumentList';
import QuickChatMode from '../components/QuickChatMode';
import ModeToggle from '../components/ModeToggle';
import RecentChats from '../components/RecentChats';
import { toast } from 'react-toastify';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('quick'); // 'quick' or 'full'

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

  // Quick mode render
  if (mode === 'quick') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Professor AI Helper</h1>
                <p className="text-sm text-gray-600">Быстрое общение с документами</p>
              </div>
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-80px)]">
          <QuickChatMode onBackToFull={() => setMode('full')} />
        </div>
      </div>
    );
  }

  // Full mode render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-lg text-gray-600">Управление документами и взаимодействие с ИИ</p>
            </div>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Загрузка документов</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Загрузите документ</h3>
                    <p className="text-gray-600 mb-4">Поддерживаются PDF, DOC, DOCX, TXT файлы</p>
                  </div>
                  
                  <input 
                    id="file-upload-input" 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  
                  <button 
                    onClick={handleUpload} 
                    disabled={!file || uploading} 
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Загружаем...
                      </>
                    ) : (
                      'Загрузить файл'
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Documents List */}
            <div className="mt-8">
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Загружаем документы...</span>
                  </div>
                </div>
              ) : (
                <DocumentList documents={documents} onDeleteDocument={handleDeleteDocument} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <RecentChats documents={documents} />
            
            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Всего документов</span>
                  <span className="font-semibold text-gray-900">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Загружено сегодня</span>
                  <span className="font-semibold text-gray-900">
                    {documents.filter(doc => {
                      const today = new Date().toDateString();
                      const docDate = new Date(doc.uploaded_at).toDateString();
                      return today === docDate;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
