import client from './client';

export const getEmergencyRequests = async () => {
  const response = await client.get('/emergency-requests/');
  return response.data;
};

export const getEmergencyRequest = async (id) => {
  const response = await client.get(`/emergency-requests/${id}`);
  return response.data;
};

export const createEmergencyRequest = async (data) => {
  // Query parameters mapping
  const response = await client.post('/emergency-requests/', null, {
    params: {
      description: data.description,
      location_lat: parseFloat(data.location_lat),
      location_lng: parseFloat(data.location_lng),
      location_name: data.location_name,
      category: data.category || null,
      priority: data.priority || null,
      people_affected: parseInt(data.people_affected || 1),
      injured: !!data.injured,
      urgency_reason: data.urgency_reason || null,
      disaster_event_id: data.disaster_event_id ? parseInt(data.disaster_event_id) : null,
    },
  });
  return response.data;
};

export const updateEmergencyRequestStatus = async (id, newStatus) => {
  const response = await client.patch(`/emergency-requests/${id}/status`, null, {
    params: {
      new_status: newStatus,
    },
  });
  return response.data;
};

export const getRecommendedVolunteers = async (id) => {
  const response = await client.get(`/emergency-requests/${id}/recommended-volunteers`);
  return response.data;
};

export const deleteEmergencyRequest = async (id) => {
  const response = await client.delete(`/emergency-requests/${id}`);
  return response.data;
};
