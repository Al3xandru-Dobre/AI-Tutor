const { post, get, put, delete: del } = require('./api');

async function login(email, password) {
  const response = await post('/auth/login', { email, password });
  return response;
}

async function register(email, password, name) {
  const response = await post('/auth/register', { email, password, name });
  return response;
}

async function logout() {
  const response = await post('/auth/logout', {});
  return response;
}

async function getProfile() {
  const response = await get('/auth/profile');
  return response;
}

async function updateProfile(data) {
  const response = await put('/auth/profile', data);
  return response;
}

async function verifyEmail(token) {
  const response = await get(`/auth/verify/${token}`);
  return response;
}

async function forgotPassword(email) {
  const response = await post('/auth/forgot', { email });
  return response;
}

async function resetPassword(token, newPassword) {
  const response = await post(`/auth/reset/${token}`, { password: newPassword });
  return response;
}

async function getCsrfToken() {
  const response = await get('/auth/csrf-token');
  return response;
}

async function checkAuth() {
  try {
    const response = await get('/auth/profile');
    return response.user || null;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

module.exports = {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCsrfToken,
  checkAuth
};
