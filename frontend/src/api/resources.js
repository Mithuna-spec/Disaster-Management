import client from './client';

export const getResources = async () => {
  const response = await client.get('/resources/');
  return response.data;
};

export const getResource = async (id) => {
  const response = await client.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (data) => {
  const response = await client.post('/resources/', null, {
    params: {
      name: data.name,
      resource_type: data.resource_type,
      quantity: parseFloat(data.quantity),
      unit: data.unit,
      minimum_threshold: parseFloat(data.minimum_threshold || 0),
    },
  });
  return response.data;
};

export const updateInventory = async (id, changeType, quantity, taskId = null) => {
  const params = {
    change_type: changeType,
    quantity: parseFloat(quantity),
  };
  if (taskId) {
    params.task_id = parseInt(taskId);
  }
  
  const response = await client.patch(`/resources/${id}/inventory`, null, { params });
  return response.data;
};

export const getInventoryLogs = async (id) => {
  const response = await client.get(`/resources/${id}/logs`);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await client.delete(`/resources/${id}`);
  return response.data;
};
