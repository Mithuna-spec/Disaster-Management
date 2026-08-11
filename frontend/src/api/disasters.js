import client from './client';

export const getDisasters = async () => {
  const response = await client.get('/disasters/');
  return response.data;
};

export const getDisaster = async (id) => {
  const response = await client.get(`/disasters/${id}`);
  return response.data;
};

export const createDisaster = async (data) => {
  const response = await client.post('/disasters/', null, {
    params: {
      name: data.name,
      description: data.description || null,
      disaster_type: data.disaster_type || 'OTHER',
      severity: data.severity || 'MEDIUM',
      status_value: data.status_value || 'ACTIVE',
      center_lat: parseFloat(data.center_lat || 0),
      center_lng: parseFloat(data.center_lng || 0),
      area_name: data.area_name || '',
    },
  });
  return response.data;
};

export const deleteDisaster = async (id) => {
  const response = await client.delete(`/disasters/${id}`);
  return response.data;
};
