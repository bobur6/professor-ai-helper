import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiMessageSquare, FiFile, FiX, FiSend, FiPaperclip } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadDocument, queryClassAI } from '../services/api';

function QuickChatMode({ onBackToFull }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: Date.now(),
      user_query: null,
      ai_response: 'Привет! Я ваш ИИ-помощник для преподавателей. Можете задать любой вопрос или загрузить документ для анализа.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

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
      
      // Add file upload message to chat
      const fileMessage = {
        id: Date.now(),
        user_query: null,
        ai_response: `📄 Документ "${file.name}" успешно загружен! Теперь я могу отвечать на вопросы по его содержимому.`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, fileMessage]);
      
      toast.success(`Документ "${file.name}" успешно загружен!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim() || isSending) return;

    const userMessage = {
      id: Date.now(),
      user_query: query,
      ai_response: null,
      timestamp: new Date().toISOString(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');
    setIsSending(true);

    try {
      // Format history for API - create proper conversation pairs
      const formattedHistory = [];
      
      chatHistory.forEach((msg) => {
        if (msg.user_query) {
          formattedHistory.push({
            role: "user",
            content: msg.user_query
          });
        }
        if (msg.ai_response) {
          formattedHistory.push({
            role: "assistant", 
            content: msg.ai_response
          });
        }
      });

      const response = await queryClassAI(documentContent || "", query, formattedHistory);
      
      const aiMessage = {
        ...userMessage,
        ai_response: response.data.message || 'Извините, не удалось получить ответ.',
      };
      
      setChatHistory(prev => [...prev.slice(0, -1), aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        ...userMessage,
        ai_response: 'Произошла ошибка при обращении к ИИ. Попробуйте еще раз.',
      };
      setChatHistory(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setSelectedFile(null);
    setDocumentContent('');
    setChatHistory([{
      id: Date.now(),
      user_query: null,
      ai_response: 'Привет! Я ваш ИИ-помощник для преподавателей. Можете задать любой вопрос или загрузить документ для анализа.',
      timestamp: new Date().toISOString(),
    }]);
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
      // Format history for API
      const formattedHistory = [];
      chatHistory.forEach((msg) => {
        if (msg.user_query) {
          formattedHistory.push({
            role: "user",
            content: msg.user_query
          });
        }
        if (msg.ai_response) {
          formattedHistory.push({
            role: "assistant", 
            content: msg.ai_response
          });
        }
      });

      const response = await queryClassAI(documentContent, query, formattedHistory);
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Chat Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full"
      >
        {chatHistory.map((chat, index) => (
          <div key={`${chat.id || index}-${chat.timestamp || ''}`} className="space-y-4">
            {/* User Message */}
            {chat.user_query && (
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-md">
                  <p className="whitespace-pre-wrap break-words">{chat.user_query}</p>
                </div>
              </div>
            )}

            {/* AI Response */}
            {chat.ai_response && (
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                  {chat.ai_response === null ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-sm">Думаю...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap break-words text-gray-800">{chat.ai_response}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator for new message */}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Думаю...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto w-full">
          {/* File attachment indicator */}
          {selectedFile && (
            <div className="mb-3 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <FiFile className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-800">📄 {selectedFile.name}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setDocumentContent('');
                }}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Quick Actions */}
          {selectedFile && (
            <div className="mb-3 flex flex-wrap gap-2">
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
          )}

          {/* Input field */}
          <div className="flex items-end space-x-3">
            {/* New chat button - moved to left */}
            <button
              onClick={handleNewChat}
              className="px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors flex-shrink-0"
              title="Новый чат"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Задайте вопрос..."
                className="w-full px-4 py-3 pr-12 text-gray-800 bg-gray-50 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isSending}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              
              {/* File upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-12 bottom-3 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Прикрепить файл"
              >
                <FiPaperclip className="w-4 h-4" />
              </button>
              
              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={isSending || !query.trim()}
                className="absolute right-3 bottom-3 p-1.5 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 transition-colors"
                title="Отправить"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="mt-2 text-xs text-gray-500 text-center">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Drag overlay */}
      {dragActive && (
        <div 
          className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center z-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <FiUpload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">Отпустите файл для загрузки</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickChatMode;