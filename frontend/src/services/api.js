const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';


class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = localStorage.getItem('raaed_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.signal) {
          errorMessage = `Signal: ${errorData.signal}`;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach the server. Is the backend running?');
      }
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', `${this.baseUrl}${endpoint}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed: Network error'));
      xhr.send(formData);
    });
  }
}

export const api = new ApiClient();

// ── Service Functions ────────────────────────────────────────

export const healthCheck = () => api.get('/');

// Data services
export const uploadFile = (projectId, file, onProgress) =>
  api.upload(`/data/upload/${projectId}`, file, onProgress);

export const processFiles = (projectId, options = {}) =>
  api.post(`/data/process/${projectId}`, {
    chunk_size: options.chunkSize || 100,
    overlap_size: options.overlapSize || 20,
    do_reset: options.doReset ? 1 : 0,
    file_id: options.fileId || null,
  });

// NLP services
export const pushToIndex = (projectId, doReset = false) =>
  api.post(`/nlp/index/push/${projectId}`, { do_reset: doReset ? 1 : 0 });

export const getIndexInfo = (projectId) =>
  api.get(`/nlp/index/info/${projectId}`);

export const searchIndex = (projectId, text, limit = 5) =>
  api.post(`/nlp/index/search/${projectId}`, { text, limit });

export const answerQuestion = (projectId, text, limit = 5) =>
  api.post(`/nlp/index/answer/${projectId}`, { text, limit });

// Agent services
export const chatWithAgent = (projectId, message, sessionId = null) =>
  api.post(`/agent/chat/${projectId}`, { message, session_id: sessionId });

export const generateQuiz = (projectId, topic, numQuestions = 5) =>
  api.post(`/agent/quiz/${projectId}`, { topic, num_questions: numQuestions });

export const clearSession = (sessionId) =>
  api.delete(`/agent/session/${sessionId}`);

export const getActiveGuidelines = (projectId) =>
  api.get(`/agent/guidelines/active/${projectId}`);

export const getAssignedQuizzes = (projectId) =>
  api.get(`/agent/quizzes/${projectId}`);

export const submitQuizResult = (payload) =>
  api.post('/agent/quizzes/results', payload);

export const getCompletedQuizzes = (studentId) =>
  api.get(`/agent/quizzes/completed/${studentId}`);

// Admin services
export const createTask = (request, sessionId = null) =>
  api.post('/admin/task/create', { request, session_id: sessionId });

export const adminHealthCheck = () =>
  api.get('/admin/health');

// Projects & Assets Services
export const getProjects = () =>
  api.get('/data/projects');

export const deleteProject = (projectId) =>
  api.delete(`/data/projects/${projectId}`);

export const getAssets = () =>
  api.get('/data/assets');

export const deleteAsset = (assetId) =>
  api.delete(`/data/assets/${assetId}`);

// Guidelines Services
export const getGuidelines = () =>
  api.get('/admin/guidelines');

export const saveGuideline = (guideline) =>
  api.post('/admin/guidelines', guideline);

export const toggleGuideline = (taskId) =>
  api.put(`/admin/guidelines/${taskId}/toggle`);

export const deleteGuideline = (taskId) =>
  api.delete(`/admin/guidelines/${taskId}`);

// Admin User Management Services
export const getUsers = () =>
  api.get('/admin/users');

export const updateUserRole = (userId, role) =>
  api.put(`/admin/users/${userId}/role`, { role });

export const getUserResults = (userId) =>
  api.get(`/admin/users/${userId}/results`);
