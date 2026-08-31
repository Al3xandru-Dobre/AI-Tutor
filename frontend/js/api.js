const API_BASE_URL = '/api';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function refreshToken() {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenResolve((token) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    onRefreshed(data.csrfToken);
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    window.location.href = 'login.html';
    throw error;
  } finally {
    isRefreshing = false;
  }
}

async function apiRequest(url, options = {}) {
  const csrfToken = getCookie('csrfToken');

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...options.headers
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    let response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);

    if (response.status === 401) {
      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse && refreshResponse.csrfToken) {
          const newCsrfToken = refreshResponse.csrfToken;
          
          const retryOptions = {
            ...mergedOptions,
            headers: {
              ...mergedOptions.headers,
              'X-CSRF-Token': newCsrfToken
            }
          };

          response = await fetch(`${API_BASE_URL}${url}`, retryOptions);
        }
      } catch (refreshError) {
        throw refreshError;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      const error = new Error(errorData.message || 'Request failed');
      error.status = response.status;
      error.code = errorData.code;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

async function get(url, options = {}) {
  return apiRequest(url, { ...options, method: 'GET' });
}

async function post(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function put(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function del(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' });
}

module.exports = {
  apiRequest,
  get,
  post,
  put,
  delete: del,
  getCookie,
  refreshToken
};
