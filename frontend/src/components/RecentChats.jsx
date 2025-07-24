import React from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiFile, FiClock } from 'react-icons/fi';

function RecentChats({ documents = [] }) {
  // Get the 5 most recent documents
  const recentDocuments = documents
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 5);

  if (recentDocuments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FiClock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Недавние чаты</h3>
        </div>
        <div className="text-center py-8">
          <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Пока нет недавних чатов</p>
          <p className="text-sm text-gray-400 mt-1">
            Загрузите документ, чтобы начать общение с ИИ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiClock className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Недавние чаты</h3>
        </div>
        <span className="text-sm text-gray-500">{recentDocuments.length} документов</span>
      </div>
      
      <div className="space-y-3">
        {recentDocuments.map((doc) => (
          <Link
            key={doc.id}
            to={`/documents/${doc.id}`}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <FiFile className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {doc.file_name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {new Date(doc.uploaded_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 capitalize">
                  {doc.file_type?.split('/')[1] || 'файл'}
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <FiMessageSquare className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
      
      {documents.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            to="/documents"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Посмотреть все документы →
          </Link>
        </div>
      )}
    </div>
  );
}

export default RecentChats;