import React from 'react';
import { FiZap, FiSettings } from 'react-icons/fi';

function ModeToggle({ mode, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
      <button
        onClick={() => onChange('quick')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
          mode === 'quick'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <FiZap className="w-4 h-4" />
        <span>Быстрый чат</span>
      </button>
      
      <button
        onClick={() => onChange('full')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
          mode === 'full'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <FiSettings className="w-4 h-4" />
        <span>Полный режим</span>
      </button>
    </div>
  );
}

export default ModeToggle;