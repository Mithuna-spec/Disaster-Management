import client from './client';

export const getVolunteers = async () => {
  const response = await client.get('/volunteers/');
  return response.data;
};

export const getMyVolunteerProfile = async () => {
  const response = await client.get('/volunteers/me');
  return response.data;
};

export const createVolunteerProfile = async (data) => {
  const response = await client.post('/volunteers/profile', {
    skills: data.skills || [],
    interests: data.interests || [],
  }, {
    params: {
      vehicle_available: !!data.vehicle_available,
      vehicle_type: data.vehicle_type || null,
      medical_training: !!data.medical_training,
      location_lat: parseFloat(data.location_lat || 0),
      location_lng: parseFloat(data.location_lng || 0),
      location_name: data.location_name || '',
    },
  });
  return response.data;
};
