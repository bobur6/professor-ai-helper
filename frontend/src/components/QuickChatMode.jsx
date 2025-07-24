import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiMessageSquare, FiFile, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadDocument, queryClassAI } from '../services/api';
import ChatWindow from './ChatWindow';

function QuickChatMode({ onBackToFull }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadDocument(file);
      setSelectedFile({
        name: file.name,
        id: response.data.id,
        content: response.data.extracted_text_content || ''
      });
      setDocumentContent(response.data.extracted_text_content || '');
      
      // Initialize chat with welcome message
      setChatHistory([{
        id: Date.now(),
        user_query: null,
        ai_response: `Привет! Я готов обсудить ваш документ "${file.name}". Задавайте любые вопросы!`,
        timestamp: new Date().toISOString(),
      }]);
      
      toast.success(`Документ "${file.name}" успешно загружен!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleNewChat = () => {
    setSelectedFile(null);
    setDocumentContent('');
    setChatHistory([]);
  };

  const handleQuickAction = async (action) => {
    if (!documentContent) return;

    let query = '';
    switch (action) {
      case 'questions':
        query = 'Составь 5-7 вопросов по материалу для проверки понимания';
        break;
      case 'summary':
        query = 'Сделай краткое резюме основных идей документа';
        break;
      case 'keywords':
        query = 'Выдели ключевые слова и термины из документа';
        break;
      default:
        return;
    }

    // Add user message to history
    const userMessage = {
      id: Date.now(),
      user_query: query,
      ai_response: null,
      timestamp: new Date().toISOString(),
    };

    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await queryClassAI(documentContent, query, chatHistory);
      const aiMessage = {
        ...userMessage,
        ai_response: response.data.message || 'Не удалось получить ответ.',
      };
      setChatHistory(prev => [...prev.slice(0, -1), aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        ...userMessage,
        ai_response: 'Произошла ошибка при обращении к ИИ. Попробуйте еще раз.',
      };
      setChatHistory(prev => [...prev.slice(0, -1), errorMessage]);
    }
  };

  if (selectedFile) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiFile className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  🚀 Быстрый чат с: {selectedFile.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Задавайте любые вопросы по документу
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewChat}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Новый чат
              </button>
              {onBackToFull && (
                <button
                  onClick={onBackToFull}
                  className="px-3 py-1.5 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
                >
                  Полный режим
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">💡 Быстрые действия:</span>
            <button
              onClick={() => handleQuickAction('questions')}
              className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
            >
              📝 Составить вопросы
            </button>
            <button
              onClick={() => handleQuickAction('summary')}
              className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
            >
              📊 Сделать резюме
            </button>
            <button
              onClick={() => handleQuickAction('keywords')}
              className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
            >
              🔍 Ключевые слова
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow 
            documentId={selectedFile.id}
            initialHistory={chatHistory}
            onNewMessage={(newMessage) => {
              setChatHistory(prev => [...prev, newMessage]);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Быстрый чат с документом
          </h1>
          <p className="text-lg text-gray-600">
            Загрузите документ и сразу начните общение с ИИ
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Загружаем документ...</p>
              <p className="text-sm text-gray-500">Пожалуйста, подождите</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Перетащите файл сюда
              </h3>
              <p className="text-gray-600 mb-4">или</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <FiFile className="w-5 h-5" />
                <span>Выбрать файл</span>
              </button>
              
              <div className="mt-6 text-sm text-gray-500">
                <p className="font-medium mb-1">Поддерживаемые форматы:</p>
                <p>PDF, DOC, DOCX, TXT</p>
              </div>
            </div>
          )}
        </div>

        {/* Back to Full Mode */}
        {onBackToFull && (
          <div className="mt-6 text-center">
            <button
              onClick={onBackToFull}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Вернуться к полному режиму
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickChatMode;