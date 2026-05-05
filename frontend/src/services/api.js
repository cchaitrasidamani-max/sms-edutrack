import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sms_token')
      localStorage.removeItem('sms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getByCourse: (courseId) => api.get(`/students/course/${courseId}`),
  getProfile: () => api.get('/students/profile'),
}

export const courseAPI = {
  getAll: () => api.get('/courses'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
}

export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  markBulk: (data) => api.post('/attendance/bulk', data),
  getByStudent: (id) => api.get(`/attendance/student/${id}`),
  getByCourseDate: (courseId, subject, date) => api.get(`/attendance/course/${courseId}`, { params: { subject, date } }),
  getSummary: (id) => api.get(`/attendance/summary/${id}`),
}

export const resultAPI = {
  add: (data) => api.post('/results', data),
  getByStudent: (id) => api.get(`/results/student/${id}`),
  getBySemester: (studentId, sem) => api.get(`/results/student/${studentId}/semester/${sem}`),
  getReport: (id) => api.get(`/results/report/${id}`),
  update: (id, data) => api.put(`/results/${id}`, data),
  getMy: () => api.get('/results/my'),
}

export const notificationAPI = {
  getMy: () => api.get('/notifications/my'),
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api
