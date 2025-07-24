import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMessageSquare, FiFileText, FiHelpCircle } from 'react-icons/fi';
import { Tabs, Tab, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import apiClient, { getDocument, debugDocument, queryClassAI } from '../services/api';
import { toast } from 'react-toastify';
import ChatWindow from '../components/ChatWindow';
import TeachingAssistantPanel from '../components/TeachingAssistantPanel';
import AIContentRenderer from '../components/AIContentRenderer';

// Custom styles for the document viewer
const customStyles = `
  .document-viewer {
    height: calc(100vh - 180px);
    min-height: 500px;
  }
  
  .text-panel, .chat-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .document-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #ffffff;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  /* Custom scrollbar */
  .document-content::-webkit-scrollbar {
    width: 8px;
  }
  
  .document-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .document-content::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }
  
  .document-content::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
  
  /* React Tabs customization */
  .react-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .react-tabs__tab-list {
    margin: 0 0 1rem 0;
    padding: 0;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    gap: 0.5rem;
  }
  
  .react-tabs__tab {
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 0.375rem 0.375rem 0 0;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  
  .react-tabs__tab:hover {
    color: #2d3748;
    background-color: #f7fafc;
  }
  
  .react-tabs__tab--selected {
    color: #3182ce;
    border-color: #e2e8f0;
    border-bottom-color: #ffffff;
    background-color: #ffffff;
    position: relative;
    top: 1px;
  }
  
  .react-tabs__tab-panel {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .react-tabs__tab-panel--selected {
    display: flex;
  }
`;

// Custom markdown renderer with syntax highlighting
const MarkdownRenderer = ({ content }) => {
  const [copied, setCopied] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = customStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCopy = (text, index) => {
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!content) return null;

  // Simple markdown to HTML conversion with syntax highlighting
  const renderMarkdown = (text) => {
    // Handle code blocks with syntax highlighting
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    let result = text;
    let match;
    let index = 0;
    
    // Process code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match;
      const highlightedCode = (
        <div key={`code-${index}`} className="relative">
          <button className="copy-button">
            {copied === index ? 'Copied!' : 'Copy'}
          </button>
          <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
            <code>{code.replace(/^\n|\n$/g, '')}</code>
          </pre>
        </div>
      );
      
      result = result.replace(fullMatch, `%%CODE_BLOCK_${index}%%`);
      result = result.split(`%%CODE_BLOCK_${index}%%`).join(highlightedCode);
      index++;
    }
    
    // Handle other markdown elements (simplified)
    return result
      .split('\n\n')
      .map((paragraph, i) => {
        // Handle headers
        if (paragraph.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
        }
        if (paragraph.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
        }
        if (paragraph.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('# ', '')}</h1>;
        }
        
        // Handle lists
        if (paragraph.startsWith('- ')) {
          return (
            <ul key={i} className="list-disc pl-5 my-2 space-y-1">
              {paragraph.split('\n').map((item, j) => (
                <li key={j}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
        }
        
        // Handle code spans
        const codeSpanRegex = /`([^`]+)`/g;
        const parts = [];
        let lastIndex = 0;
        let codeMatch;
        
        while ((codeMatch = codeSpanRegex.exec(paragraph)) !== null) {
          if (codeMatch.index > lastIndex) {
            parts.push(paragraph.substring(lastIndex, codeMatch.index));
          }
          parts.push(<code key={codeMatch.index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{codeMatch[1]}</code>);
          lastIndex = codeMatch.index + codeMatch[0].length;
        }
        
        if (lastIndex < paragraph.length) {
          parts.push(paragraph.substring(lastIndex));
        }
        
        return <p key={i} className="my-3 leading-relaxed">{parts.length ? parts : paragraph}</p>;
      });
  };

  return <div ref={contentRef} className="markdown-content">{renderMarkdown(content)}</div>;
};

function DocumentView() {
  // Get the document ID from URL parameters - must match the route parameter name in App.jsx
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  // Log the document ID from URL params for debugging
  console.log('DocumentView initialized with documentId from URL params:', documentId);
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiResponseType, setAiResponseType] = useState('markdown');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log(`Raw document ID from URL: "${documentId}"`);
        
        // Validate that we have an ID and it's a valid positive integer
        if (!documentId) {
          console.error('Document ID is missing in URL params');
          setError('Document ID is missing');
          return;
        }
        
        // Validate that the ID is a number using regex
        if (!/^\d+$/.test(documentId)) {
          console.error(`Invalid document ID format: "${documentId}"`);
          setError('Invalid document ID: must be a number');
          return;
        }
        
        // Convert to number after validation
        const docId = parseInt(documentId, 10);
        
        // Additional validation for positive integers
        if (docId <= 0) {
          console.error(`Document ID must be positive: ${docId}`);
          setError('Invalid document ID: must be a positive number');
          return;
        }
        
        console.log(`Fetching document with ID: ${docId}`);
        const docResponse = await getDocument(docId);
        
        // Check if we got a valid response
        if (!docResponse || !docResponse.data) {
          console.error('Empty response received from API');
          setError('Failed to load document data');
          return;
        }
        
        console.log('Document data received:', docResponse.data);
        
        // Check if document has extracted text content
        if (!docResponse.data.extracted_text_content) {
          console.warn("Document has no extracted text content!");
        } else {
          console.log("Document text content length:", docResponse.data.extracted_text_content.length);
          // Log the first 100 characters for debugging
          console.log("Document text content preview:", 
            docResponse.data.extracted_text_content.substring(0, 100) + "...");
        }
        
        setDocument(docResponse.data);
        setChatHistory([
          {
            role: 'assistant',
            content: 'Welcome! You can ask me questions about this document.'
          }
        ]);
      } catch (err) {
        console.error('Error fetching document:', err);
        let errorMsg = 'Failed to load document.';
        
        // Check for our custom validation error first
        if (err.message && err.message.includes('Invalid document ID')) {
          errorMsg = err.message;
        }
        // Check for user-friendly message we added in the API service
        else if (err.userMessage) {
          errorMsg = err.userMessage;
        }
        // Handle different error types from the server
        else if (err.response) {
          console.log('Error response status:', err.response.status);
          console.log('Error response data:', err.response.data);
          
          const status = err.response.status;
          
          if (status === 404) {
            errorMsg = 'Document not found or you do not have access.';
          } else if (status === 401 || status === 403) {
            errorMsg = 'Access denied. Please log in again.';
            // Redirect to login if token is invalid
            localStorage.removeItem('accessToken');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else if (status >= 500) {
            errorMsg = 'Server error. Please try again later.';
          } else {
            errorMsg = err.response.data?.detail || errorMsg;
          }
        } else if (err.request) {
          // Request was made but no response received
          console.log('No response received:', err.request);
          errorMsg = 'No response from server. Please check your connection.';
        } else {
          // Something else caused the error
          console.log('Error message:', err.message);
          errorMsg = err.message || 'An unexpected error occurred';
        }
        
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, navigate]);

  const handleSendMessage = useCallback(async (message, requestData = null, commandType = 'chat') => {
    if ((!message.trim() && !requestData) || isProcessing) return;
    try {
      setIsProcessing(true);
      setAiResponse(null);
      
      // Add user message to chat history
      if (!requestData) {
        const userMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);
      }
      
      // Send document text as context for the AI
      const documentText = document?.extracted_text_content || '';
      
      // Call the AI service with document context
      const response = await queryClassAI(documentText, message, chatHistory);
      
      if (!response.data || !response.data.message) {
        throw new Error('Invalid response from AI service');
      }
      
      // Add AI response to chat history
      const aiMessage = { 
        role: 'assistant', 
        content: response.data.message 
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to process your request.';
      toast.error(errorMsg);
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I'm sorry, but I encountered an error: ${errorMsg}`,
          isError: true
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [document, isProcessing, chatHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Document</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => {
                setError('');
                setLoading(true);
                // Small delay to ensure state updates before reload
                setTimeout(() => window.location.reload(), 100);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-left text-xs">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Document ID: {documentId || 'Not provided'}</p>
              <p>ID valid: {documentId && /^\d+$/.test(documentId) ? 'Yes' : 'No'}</p>
              <p>URL: {window.location.href}</p>
              <p>Path: {window.location.pathname}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={async () => {
                    try {
                      // Validate ID before sending debug request
                      if (!documentId || !/^\d+$/.test(documentId)) {
                        alert('Cannot debug: Invalid document ID');
                        return;
                      }
                      
                      const docId = parseInt(documentId, 10);
                      console.log(`Sending debug request for document ID: ${docId}`);
                      const debugResponse = await debugDocument(docId);
                      console.log('Document debug info:', debugResponse.data);
                      
                      // Show more detailed information in the alert
                      const debugInfo = debugResponse.data;
                      const documentExists = debugInfo.document_exists;
                      const hasAccess = debugInfo.access_check?.has_access;
                      
                      alert(`Debug info logged to console.\nDocument exists: ${documentExists}\nHas access: ${hasAccess || 'N/A'}`);
                    } catch (err) {
                      console.error('Debug error:', err);
                      alert('Debug failed - see console');
                    }
                  }}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Run Diagnostics
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Use the correct path without the duplicate prefix
                      const response = await apiClient.get('/documents');
                      console.log('API request URL:', response.config.url);
                      console.log('All documents:', response.data);
                      alert(`Found ${response.data.length} documents. See console for details.`);
                    } catch (err) {
                      console.error('Error fetching documents:', err);
                      alert('Failed to fetch documents - see console');
                    }
                  }}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                  List All Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header - Compact */}
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{document.file_name}</h1>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab(0)}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 0
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Document
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Assistant
              </button>

            </nav>
          </div>
          
          {/* Main Content */}
          <div className="document-viewer" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Document Panel */}
            <div 
              className={`p-4 overflow-auto ${activeTab !== 0 ? 'hidden' : ''}`}
              style={{ height: 'calc(100vh - 200px)' }}
            >
              <div className="document-content">
                {document.extracted_text_content ? (
                  <MarkdownRenderer content={document.extracted_text_content} />
                ) : (
                  <p className="text-gray-500">No content available</p>
                )}
              </div>
            </div>
            
            {/* Chat Panel */}
            <div 
              className={`h-full flex flex-col ${activeTab !== 1 ? 'hidden' : ''}`}
              style={{ height: 'calc(100vh - 200px)' }}
            >
              <div className="flex-1 overflow-hidden flex flex-col">
                <ChatWindow 
                  documentId={document.id} 
                  initialHistory={chatHistory} 
                  onNewMessage={(newMessage) => {
                    setChatHistory(prev => [...prev, newMessage]);
                  }} 
                />
              </div>
            </div>
            

          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentView;