import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiX, FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

const TeachingAssistantPanel = ({ 
  documentId, 
  documentText, 
  onCommandSubmit, 
  isProcessing, 
  disabled = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('quiz');
  const [options, setOptions] = useState({
    questionCount: 5,
    difficulty: 'medium',
    questionType: 'multiple_choice',
    summaryType: 'concise',
    summaryLength: 'medium'
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const panelRef = useRef(null);

  // Toggle panel expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle option changes
  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Generate content based on active tab
  const generateContent = async () => {
    if (!documentText) {
      toast.warning('Please load a document first');
      return;
    }

    try {
      let command = '';
      let requestData = {};
      
      switch (activeTab) {
        case 'quiz':
          command = `Generate a ${options.difficulty} level quiz with ${options.questionCount} ${options.questionType} questions`;
          requestData = {
            document_text: documentText,
            question_count: options.questionCount,
            difficulty: options.difficulty,
            question_types: [options.questionType]
          };
          break;
          
        case 'questions':
          command = `Generate ${options.questionCount} study questions about the document`;
          requestData = {
            document_text: documentText,
            count: options.questionCount,
            question_type: options.questionType
          };
          break;
          
        case 'summary':
          command = `Generate a ${options.summaryType} summary of the document`;
          requestData = {
            document_text: documentText,
            query: command,
            summary_type: options.summaryType,
            length: options.summaryLength
          };
          break;
          
        case 'custom':
          if (!customPrompt.trim()) {
            toast.warning('Please enter a custom prompt');
            return;
          }
          command = customPrompt;
          requestData = {
            document_text: documentText,
            custom_prompt: customPrompt
          };
          break;
          
        default:
          return;
      }
      
      // Call the parent component's handler with the command
      onCommandSubmit(command, requestData, activeTab);
      
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    }
  };

  // Tooltip component
  const Tooltip = ({ content, children }) => (
    <div className="relative group inline-block">
      {children}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 
        transition-opacity duration-200 absolute bottom-full left-1/2 transform -translate-x-1/2 
        mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
        {content}
      </div>
    </div>
  );

  return (
    <div 
      ref={panelRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 mb-4 ${
        isExpanded ? 'max-h-[500px]' : 'max-h-12'
      }`}
    >
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between p-3 bg-blue-600 text-white cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <h3 className="font-medium">Teaching Assistant</h3>
          <Tooltip content="Click to expand/collapse">
            <span className="ml-2">
              {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center space-x-1">
          <Tooltip content="Help">
            <button 
              className="p-1 rounded-full hover:bg-blue-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Open help modal or show tooltip
              }}
            >
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* Panel Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {['quiz', 'questions', 'summary', 'custom'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="mb-4">
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    name="questionCount"
                    value={options.questionCount}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={options.difficulty}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    name="questionType"
                    value={options.questionType}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>
            )}
            
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    name="questionCount"
                    value={options.questionCount}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    name="questionType"
                    value={options.questionType}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  >
                    <option value="comprehension">Comprehension</option>
                    <option value="critical_thinking">Critical Thinking</option>
                    <option value="discussion">Discussion</option>
                  </select>
                </div>
              </div>
            )}
            
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary Type
                  </label>
                  <select
                    name="summaryType"
                    value={options.summaryType}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  >
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                    <option value="bullet_points">Bullet Points</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Length
                  </label>
                  <select
                    name="summaryLength"
                    value={options.summaryLength}
                    onChange={handleOptionChange}
                    className="w-full p-2 border rounded"
                    disabled={disabled || isProcessing}
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
            )}
            
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full p-2 border rounded h-32"
                    placeholder="Enter your custom prompt here..."
                    disabled={disabled || isProcessing}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeContext"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                    disabled={disabled || isProcessing}
                  />
                  <label htmlFor="includeContext" className="ml-2 block text-sm text-gray-700">
                    Include document context
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            {isCustomizing ? (
              <>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={disabled || isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save custom options
                    setIsCustomizing(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={disabled || isProcessing}
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={generateContent}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={disabled || isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingAssistantPanel;
