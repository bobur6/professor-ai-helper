import axios from 'axios';

// Define the base URL as a constant for consistency
const BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the baseURL for debugging
console.log('API client baseURL:', BASE_URL);

// Interceptor to add the auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle response errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`API Success [${response.config.method.toUpperCase()}] ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('Authentication error detected, redirecting to login');
        localStorage.removeItem('accessToken');
        // Use a more gentle approach to redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Error: Request setup failed', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = (credentials) => {
  const params = new URLSearchParams();
  params.append('username', credentials.email); // FastAPI's OAuth2PasswordRequestForm uses 'username'
  params.append('password', credentials.password);
  return apiClient.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const register = (userData) => apiClient.post('/auth/register', userData);

// Class API calls
export const getClasses = () => apiClient.get('/classes');
export const createClass = (classData) => apiClient.post('/classes', classData);
export const updateClass = (id, classData) => apiClient.put(`/classes/${id}`, classData);
export const deleteClass = (id) => apiClient.delete(`/classes/${id}`);
export const getClassDetails = (id) => apiClient.get(`/classes/${id}`);

// Document API calls
export const getDocuments = () => apiClient.get('/documents');

export const getDocument = async (documentId) => {
  try {
    // Validate document ID before making the request
    if (!documentId || isNaN(documentId) || documentId <= 0) {
      throw new Error(`Invalid document ID: ${documentId}`);
    }
    
    console.log(`Fetching document with ID: ${documentId}`);
    return await apiClient.get(`/documents/${documentId}`);
  } catch (error) {
    // If it's our validation error, rethrow it
    if (error.message && error.message.includes('Invalid document ID')) {
      throw error;
    }
    
    // For API errors, add more context
    if (error.response) {
      const status = error.response.status;
      let errorMessage = `Server returned ${status}`;
      
      if (status === 404) {
        errorMessage = `Document ${documentId} not found or you don't have access`;
      } else if (status === 401 || status === 403) {
        errorMessage = 'Authentication error - please log in again';
      } else if (error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      }
      
      console.error(`Error fetching document ${documentId}: ${errorMessage}`);
      error.userMessage = errorMessage;
    } else {
      console.error(`Error fetching document ${documentId}:`, error);
    }
    
    throw error;
  }
};

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteDocument = async (documentId) => {
  const response = await apiClient.delete(`/documents/${documentId}`);
  if (response.data && response.data.status === 'success') {
    return response.data;
  }
  throw new Error(response.data?.message || 'Failed to delete document');
};

// Student API calls
export const getStudents = (classId) => apiClient.get(`/classes/${classId}/students`);
export const addStudent = (classId, studentData) => apiClient.post(`/classes/${classId}/students`, studentData);
export const updateStudent = (classId, studentId, studentData) => 
  apiClient.put(`/classes/${classId}/students/${studentId}`, studentData);
export const removeStudent = (classId, studentId) => 
  apiClient.delete(`/classes/${classId}/students/${studentId}`);

// Assignment API calls
export const getAssignments = (classId) => apiClient.get(`/classes/${classId}/assignments`);
export const addAssignment = (classId, assignmentData) => 
  apiClient.post(`/classes/${classId}/assignments`, assignmentData);
export const updateAssignment = (classId, assignmentId, assignmentData) => 
  apiClient.put(`/classes/${classId}/assignments/${assignmentId}`, assignmentData);
export const removeAssignment = (classId, assignmentId) => 
  apiClient.delete(`/classes/${classId}/assignments/${assignmentId}`);

// Grade API calls
export const setGrade = (classId, studentId, assignmentId, gradeData) => 
  apiClient.post(`/classes/${classId}/students/${studentId}/assignments/${assignmentId}/grade`, {
    grade: gradeData.grade
  });

export const updateGrade = setGrade;

// AI Assistant API calls
export const queryClassAI = (document_text, query, history = []) => {
  return apiClient.post('/ai/chat', {
    document_text,
    query,
    history
  });
};

// Alias for queryClassAI to maintain compatibility with existing code
export const queryDocumentAI = queryClassAI;

export const generateClassReport = (text) => {
  // Отправляем строку с данными класса (JSON или табличка)
  return apiClient.post('/ai/generate-report', { text });
};

// File Report API
export const generateFileReport = async (classId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/classes/${classId}/file-report`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Import Class Data API
export const importClassData = async (classId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/classes/${classId}/import-data`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Debug API calls
export const debugDocument = async (documentId) => {
  try {
    // Validate document ID before making the request
    if (!documentId || isNaN(documentId) || documentId <= 0) {
      throw new Error(`Invalid document ID: ${documentId}`);
    }
    
    console.log(`Debugging document with ID: ${documentId}`);
    return await apiClient.get(`/documents/debug/${documentId}`);
  } catch (error) {
    console.error(`Error debugging document ${documentId}:`, error);
    throw error;
  }
};

export default apiClient;