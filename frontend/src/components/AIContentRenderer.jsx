import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { useState } from 'react';

export const AIContentRenderer = ({ content, type = 'markdown' }) => {
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render different content types
  const renderContent = () => {
    switch (type) {
      case 'quiz':
        return renderQuiz(content);
      case 'questions':
        return renderQuestions(content);
      case 'summary':
        return renderSummary(content);
      case 'markdown':
      default:
        return renderMarkdown(content);
    }
  };

  // Render quiz content
  const renderQuiz = (quizData) => {
    if (!quizData) return null;
    
    try {
      const quiz = typeof quizData === 'string' ? JSON.parse(quizData) : quizData;
      
      return (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">{quiz.title || 'Generated Quiz'}</h2>
            {quiz.description && (
              <p className="mt-1 text-sm text-gray-600">{quiz.description}</p>
            )}
          </div>
          
          <div className="space-y-8">
            {quiz.questions?.map((question, qIndex) => (
              <div key={qIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">
                    {qIndex + 1}. {question.question}
                  </h3>
                  {question.difficulty && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.difficulty}
                    </span>
                  )}
                </div>
                
                {question.options && question.options.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`p-3 rounded border ${
                          question.correct_answer === oIndex 
                            ? 'bg-green-50 border-green-200' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                          <span>{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Explanation:</h4>
                    <p className="text-sm text-blue-700">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering quiz:', error);
      return renderMarkdown(content);
    }
  };

  // Render questions content
  const renderQuestions = (questionsData) => {
    if (!questionsData) return null;
    
    try {
      const questions = Array.isArray(questionsData) 
        ? questionsData 
        : (typeof questionsData === 'string' ? JSON.parse(questionsData) : []);
      
      if (!Array.isArray(questions)) {
        throw new Error('Invalid questions format');
      }
      
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Study Questions</h2>
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {index + 1}. {q.question || 'Question ' + (index + 1)}
                </h3>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Answer:</h4>
                  <p className="text-blue-700">{q.answer || 'No answer provided'}</p>
                </div>
                
                {(q.page_reference || q.difficulty) && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    {q.page_reference && (
                      <span className="mr-3">Page: {q.page_reference}</span>
                    )}
                    {q.difficulty && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering questions:', error);
      return renderMarkdown(content);
    }
  };

  // Render summary content
  const renderSummary = (summaryData) => {
    if (!summaryData) return null;
    
    try {
      const summary = typeof summaryData === 'string' ? JSON.parse(summaryData) : summaryData;
      
      return (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {summary.title || 'Document Summary'}
            </h2>
            {summary.estimated_reading_time && (
              <p className="mt-1 text-sm text-gray-600">
                Estimated reading time: {summary.estimated_reading_time} minutes
              </p>
            )}
          </div>
          
          <div className="prose max-w-none">
            <h3>Summary</h3>
            <ReactMarkdown>{summary.summary}</ReactMarkdown>
            
            {summary.key_points && summary.key_points.length > 0 && (
              <>
                <h3>Key Points</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.key_points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </>
            )}
            
            {summary.keywords && summary.keywords.length > 0 && (
              <div className="mt-6">
                <h3>Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keywords.map((keyword, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering summary:', error);
      return renderMarkdown(content);
    }
  };

  // Render markdown content with syntax highlighting
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    return (
      <div className="prose max-w-none relative">
        <CopyToClipboard text={text} onCopy={handleCopy}>
          <button 
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
          </button>
        </CopyToClipboard>
        
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative">
                  <CopyToClipboard text={String(children).replace(/\n$/, '')} onCopy={handleCopy}>
                    <button 
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy code"
                    >
                      {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
                    </button>
                  </CopyToClipboard>
                  <SyntaxHighlighter
                    language={match[1]}
                    style={undefined}
                    customStyle={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      margin: '1rem 0',
                      overflowX: 'auto'
                    }}
                    showLineNumbers
                    wrapLines
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a: ({ node, ...props }) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th 
                className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td 
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote 
                className="border-l-4 border-gray-300 pl-4 italic text-gray-600"
                {...props}
              />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return <div className="relative">{renderContent()}</div>;
};

export default AIContentRenderer;
