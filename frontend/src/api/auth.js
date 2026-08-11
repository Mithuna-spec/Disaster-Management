import client from './client';

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  
  const response = await client.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (name, email, password, role = 'BENEFICIARY', extra = {}) => {
  const response = await client.post('/auth/register', {
    name,
    email,
    password,
    role,
    ...extra,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await client.get('/me');
  return response.data;
};
