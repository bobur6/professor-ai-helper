import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { deleteDocument } from '../services/api';

function DocumentList({ documents = [], onDeleteDocument }) {
  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await deleteDocument(documentId);
        if (response && response.status === 'success') {
          // Only call onDeleteDocument if it's provided
          if (typeof onDeleteDocument === 'function') {
            onDeleteDocument(documentId);
          }
          toast.success(response.message || 'Document deleted successfully');
        } else {
          throw new Error(response?.message || 'Failed to delete document');
        }
      } catch (error) {
        console.error('Failed to delete document:', error);
        toast.error(error.message || 'Failed to delete document');
      }
    }
  };

  if (documents.length === 0) {
    return (
      <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">You haven't uploaded any materials yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800">Your Uploaded Materials</h3>
      <ul className="mt-4 space-y-3">
        {documents.map((doc) => (
          <li key={doc.id} className="p-4 border rounded-md hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <Link to={`/documents/${doc.id}`} className="flex-grow">
                <span className="font-medium text-indigo-700">{doc.file_name}</span>
              </Link>
              <div className="flex items-center ml-4">
                <span className="text-sm text-gray-500 mr-4">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    handleDelete(doc.id); 
                  }} 
                  className="text-red-500 hover:text-red-700"
                  title="Delete document"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DocumentList;
