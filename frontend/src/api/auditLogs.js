import client from './client';

export const getAuditLogs = async () => {
  const response = await client.get('/audit-logs/');
  return response.data;
};
