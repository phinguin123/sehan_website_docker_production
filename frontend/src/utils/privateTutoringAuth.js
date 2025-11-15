/**
 * Private Tutoring Authentication Utilities
 */

/**
 * Check if user is authenticated for private tutoring
 * @returns {boolean} true if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('pt_token');
  const teacherInfo = localStorage.getItem('pt_teacher_info');
  return !!(token && teacherInfo);
};

/**
 * Get the authentication token
 * @returns {string|null} token if exists, null otherwise
 */
export const getToken = () => {
  return localStorage.getItem('pt_token');
};

/**
 * Get the refresh token
 */
export const getRefreshToken = () => {
  return localStorage.getItem('pt_refresh_token');
};

/**
 * Get teacher information
 * @returns {object|null} teacher info if exists, null otherwise
 */
export const getTeacherInfo = () => {
  const teacherInfo = localStorage.getItem('pt_teacher_info');
  try {
    return teacherInfo ? JSON.parse(teacherInfo) : null;
  } catch (error) {
    console.error('Error parsing teacher info:', error);
    return null;
  }
};

/**
 * Clear authentication data and redirect to login
 */
export const logout = () => {
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pt_refresh_token');
  localStorage.removeItem('pt_teacher_info');
  window.location.href = '/private-tutoring/login';
};

/**
 * Store tokens and teacher info
 */
export const storeTokens = (accessToken, refreshToken, teacherInfo) => {
  if (accessToken) localStorage.setItem('pt_token', accessToken);
  if (refreshToken) localStorage.setItem('pt_refresh_token', refreshToken);
  if (teacherInfo) localStorage.setItem('pt_teacher_info', JSON.stringify(teacherInfo));
};

/**
 * Handle authentication errors consistently
 * @param {Error} error - The error object from axios or other sources
 * @param {Function} showAlert - Function to show alerts (optional)
 */
export const handleAuthError = (error, showAlert = null) => {
  if (error.response?.status === 401 || 
      error.response?.data?.code === 'INVALID_TOKEN' ||
      error.response?.data?.code === 'TOKEN_EXPIRED') {
    
    if (showAlert) {
      const errorCode = error.response?.data?.code;
      const message = errorCode === 'TOKEN_EXPIRED' 
        ? 'Your session has expired. Please log in again.' 
        : 'Authentication failed. Please log in again.';
      showAlert('danger', message);
    }
    
    console.log('Authentication error detected:', error.response?.data?.code || 'UNAUTHORIZED');
    setTimeout(() => {
      logout();
    }, 2000); // Give user time to read the message
  }
};

/**
 * Create axios headers with authentication
 * @returns {object} headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    logout();
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Check authentication before making API calls
 * If not authenticated, redirect to login
 * @returns {boolean} true if authenticated, false if redirected
 */
export const ensureAuthenticated = () => {
  if (!isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    logout();
    return false;
  }
  return true;
};
