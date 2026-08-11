import client from './client';

export const getTasks = async () => {
  const response = await client.get('/tasks/');
  return response.data;
};

export const getTask = async (id) => {
  const response = await client.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (emergencyRequestId, taskType) => {
  const response = await client.post('/tasks/', null, {
    params: {
      emergency_request_id: parseInt(emergencyRequestId),
      task_type: taskType,
    },
  });
  return response.data;
};

export const assignVolunteer = async (taskId, volunteerId) => {
  const response = await client.post(`/tasks/${taskId}/assign`, null, {
    params: {
      volunteer_id: parseInt(volunteerId),
    },
  });
  return response.data;
};

export const acceptTask = async (taskId) => {
  const response = await client.post(`/tasks/${taskId}/accept`);
  return response.data;
};

export const rejectTask = async (taskId) => {
  const response = await client.post(`/tasks/${taskId}/reject`);
  return response.data;
};

export const updateTaskStatus = async (taskId, newStatus) => {
  const response = await client.patch(`/tasks/${taskId}/status`, null, {
    params: {
      new_status: newStatus,
    },
  });
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await client.delete(`/tasks/${taskId}`);
  return response.data;
};
