import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';

function FileUploadZone({ onUpload, accept = ".pdf,.doc,.docx,.txt", multiple = false, className = "" }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files) => {
    if (!multiple) {
      files = files.slice(0, 1);
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !onUpload) return;

    setUploading(true);
    try {
      if (multiple) {
        for (const file of selectedFiles) {
          await onUpload(file);
        }
      } else {
        await onUpload(selectedFiles[0]);
      }
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
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
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Загружаем файлы...</p>
            <p className="text-sm text-gray-500">Пожалуйста, подождите</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {dragActive ? 'Отпустите файлы здесь' : 'Перетащите файлы сюда'}
            </h3>
            <p className="text-gray-600 mb-4">или</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <FiFile className="w-5 h-5" />
              <span>Выбрать файл{multiple ? 'ы' : ''}</span>
            </button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p className="font-medium mb-1">Поддерживаемые форматы:</p>
              <p>PDF, DOC, DOCX, TXT</p>
              {multiple && <p className="mt-1">Можно выбрать несколько файлов</p>}
            </div>
          </div>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Выбранные файлы ({selectedFiles.length}):
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <FiFile className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Загружаем...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Загрузить файл{selectedFiles.length > 1 ? 'ы' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUploadZone;