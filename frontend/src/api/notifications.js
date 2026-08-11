import client from './client';

export const getNotifications = async () => {
  const response = await client.get('/notifications/');
  return response.data;
};

export const getNotification = async (id) => {
  const response = await client.get(`/notifications/${id}`);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await client.patch(`/notifications/${id}/read`);
  return response.data;
};
