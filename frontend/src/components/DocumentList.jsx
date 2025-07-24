import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiFile, FiMessageSquare, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { deleteDocument } from '../services/api';

function DocumentList({ documents = [], onDeleteDocument }) {
  const handleDelete = async (documentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот документ?')) {
      try {
        const response = await deleteDocument(documentId);
        if (response && response.status === 'success') {
          // Only call onDeleteDocument if it's provided
          if (typeof onDeleteDocument === 'function') {
            onDeleteDocument(documentId);
          }
          // Show success toast only once
          toast.success(response.message || 'Документ успешно удален');
        } else {
          throw new Error(response?.message || 'Failed to delete document');
        }
      } catch (error) {
        console.error('Failed to delete document:', error);
        toast.error(error.message || 'Ошибка при удалении документа');
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('text')) return '📃';
    return '📄';
  };

  const formatFileSize = (size) => {
    if (!size) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <FiFile className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет загруженных документов</h3>
          <p className="text-gray-500">Загрузите первый документ, чтобы начать работу с ИИ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Ваши документы</h3>
          <span className="text-sm text-gray-500">{documents.length} документов</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              {/* File Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">{getFileIcon(doc.file_type)}</span>
                </div>
              </div>
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 truncate">
                  {doc.file_name}
                </h4>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {doc.file_size && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </>
                  )}
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 capitalize">
                    {doc.file_type?.split('/')[1] || 'файл'}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Link
                  to={`/documents/${doc.id}`}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4 mr-1.5" />
                  Чат с ИИ
                </Link>
                
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    handleDelete(doc.id); 
                  }} 
                  className="inline-flex items-center p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Удалить документ"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentList;
