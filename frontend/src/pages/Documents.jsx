import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/api';
import DocumentList from '../components/DocumentList';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await getDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError('Не удалось загрузить документы.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = (deletedId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== deletedId));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Все документы</h1>
          <p className="mt-2 text-gray-600">Управление вашими загруженными документами</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Загружаем документы...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchDocuments}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        ) : (
          <DocumentList documents={documents} onDeleteDocument={handleDeleteDocument} />
        )}
      </div>
    </div>
  );
}

export default Documents;