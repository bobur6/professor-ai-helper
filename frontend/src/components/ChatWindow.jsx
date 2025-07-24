import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiSend, FiCopy, FiCheck, FiLoader } from 'react-icons/fi';
import { queryClassAI, getDocument } from '../services/api';

function ChatWindow({ documentId, initialHistory = [], onNewMessage }) {
  const [history, setHistory] = useState(initialHistory);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [copied, setCopied] = useState('');
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch document content when documentId changes
  useEffect(() => {
    const fetchDocumentText = async () => {
      if (documentId) {
        try {
          const response = await getDocument(documentId);
          if (response.data && response.data.extracted_text_content) {
            setDocumentText(response.data.extracted_text_content);
          } else {
            console.warn("Document has no extracted text content");
            setDocumentText(""); // Set empty string if no content
          }
        } catch (error) {
          console.error("Failed to fetch document content:", error);
        }
      }
    };
    fetchDocumentText();
  }, [documentId]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  const renderMarkdown = (text) => {
    if (!text) return null;

    // Split text into paragraphs and process each one
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    
    return paragraphs.map((paragraph, i) => {
      // Handle code blocks
      const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
      let parts = [];
      let lastIndex = 0;
      let match;
      
      // Reset regex lastIndex in case of global flag
      codeBlockRegex.lastIndex = 0;
      
      while ((match = codeBlockRegex.exec(paragraph)) !== null) {
        const [fullMatch, language, code] = match;
        
        // Add text before the code block
        if (match.index > lastIndex) {
          const beforeText = paragraph.substring(lastIndex, match.index);
          if (beforeText.trim()) {
            parts = [...parts, ...processText(beforeText)];
          }
        }
        
        // Add the code block
        parts.push(
          <div key={`code-${i}-${match.index}`} className="relative my-2 bg-gray-50 rounded-md overflow-hidden">
            <div className="flex justify-between items-center bg-gray-100 text-gray-600 text-xs px-4 py-1 border-b">
              <span className="font-mono">{language || 'code'}</span>
              <CopyToClipboard text={code} onCopy={() => handleCopy(code)}>
                <button className="flex items-center text-gray-500 hover:text-gray-700">
                  {copied === code ? (
                    <>
                      <FiCheck className="mr-1" size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className="mr-1" size={14} />
                      Copy
                    </>
                  )}
                </button>
              </CopyToClipboard>
            </div>
            <div className="p-2 overflow-x-auto">
              <SyntaxHighlighter
                language={language || 'text'}
                style={null}
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  backgroundColor: 'transparent',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  },
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
        
        lastIndex = match.index + fullMatch.length;
      }
      
      // Add remaining text after the last code block
      if (lastIndex < paragraph.length) {
        const remainingText = paragraph.substring(lastIndex);
        if (remainingText.trim()) {
          parts = [...parts, ...processText(remainingText)];
        }
      }
      
      // Ensure we have valid parts to render
      if (!parts || parts.length === 0) {
        return null;
      }
      
      // Flatten the parts array in case processText returned an array
      const flattenedParts = parts.flat().filter(Boolean);
      
      return flattenedParts.length > 0 ? (
        <div key={`p-${i}`} className="mb-3 last:mb-0">
          {flattenedParts}
        </div>
      ) : null;
    });
  };

  const processText = (text) => {
    if (!text) return [];
    
    // Handle inline code
    const codeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Reset regex lastIndex in case of global flag
    codeRegex.lastIndex = 0;
    
    while ((match = codeRegex.exec(text)) !== null) {
      // Add text before the code
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      // Add the code
      parts.push(
        <code key={`code-${match.index}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">
          {match[1]}
        </code>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last code
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }
    
    // Ensure all parts are valid React elements or strings
    return parts.map((part, idx) => {
      if (React.isValidElement(part)) {
        return React.cloneElement(part, { key: `part-${idx}` });
      }
      return part;
    });
  };

  const handleCopy = (code) => {
    setCopied(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isSending) return;

    // Check if document text is available
    if (!documentText) {
      console.warn("No document text available for AI chat");
    }

    const userMessage = {
      id: Date.now(),
      user_query: query,
      ai_response: null,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...history, userMessage];
    setHistory(updatedHistory);
    setQuery('');
    setIsSending(true);

    try {
      // Create a simple history array for the backend
      // Let's simplify the history format to avoid any potential issues
      const formattedHistory = [];
      
      // Only include the most recent messages to keep the context manageable
      // This helps avoid any potential issues with the history format
      const recentHistory = history.slice(-3); // Only use the last 3 messages
      
      // Ensure each message has both role and content properties
      for (const msg of recentHistory) {
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
      }
      
      // Log the formatted history for debugging
      console.log("Formatted history:", JSON.stringify(formattedHistory));
      
      // We don't need to add the current query to history
      // It will be sent separately as the 'query' parameter

      // Log document text for debugging
      console.log("Document text length:", documentText ? documentText.length : 0);
      
      // Use document text instead of document ID
      const response = await queryClassAI(documentText || "", query, formattedHistory);
      
      const aiMessage = {
        ...userMessage,
        ai_response: response.data.message || 'No response from AI.',
      };
      setHistory(prev => [...prev.slice(0, -1), aiMessage]);
      if (onNewMessage) onNewMessage(aiMessage);
    } catch (error) {
      console.error('Failed to get chat response:', error);
      const errorMessage = {
        ...userMessage,
        ai_response: 'Sorry, I encountered an error processing your request. Please try again.',
      };
      setHistory(prev => [...prev.slice(0, -1), errorMessage]);
      if (onNewMessage) onNewMessage(errorMessage);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Ask me anything about this document</h3>
            <p className="text-sm max-w-md">I can help you understand, analyze, and extract insights from the document content.</p>
          </div>
        ) : (
          history.map((chat, index) => (
            <div key={`${chat.id || index}-${chat.timestamp || ''}`} className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-[90%] lg:max-w-3xl">
                  <div className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-t-2xl rounded-l-2xl">
                    <p className="whitespace-pre-wrap break-words">{chat.user_query}</p>
                  </div>
                  <div className="text-[10px] text-gray-500 text-right mt-0.5 pr-1">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[90%] lg:max-w-3xl">
                  <div className="bg-gray-50 border border-gray-200 px-3 py-2 text-sm rounded-t-2xl rounded-r-2xl">
                    {chat.ai_response === null ? (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <FiLoader className="animate-spin w-3 h-3" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {renderMarkdown(chat.ai_response)}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 pl-1">
                    {chat.ai_response && (
                      <span>{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form 
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-3 bg-gray-50"
      >
        <div className="relative flex items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="w-full px-3 py-2 pr-10 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '150px' }}
              disabled={isSending}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={isSending || !query.trim()}
              className="absolute right-2 bottom-2 p-1 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 focus:outline-none"
              title="Send message"
            >
              {isSending ? (
                <FiLoader className="animate-spin w-4 h-4" />
              ) : (
                <FiSend className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

export default ChatWindow;