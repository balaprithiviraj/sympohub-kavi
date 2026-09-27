import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sympohub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401, clear stale credentials (pages handle redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = error?.config?.url || '';
      // Don't wipe on login/register failure itself
      if (!url.includes('/students/login') && !url.includes('/students/register')) {
        localStorage.removeItem('sympohub_token');
        localStorage.removeItem('sympohub_user');
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) {
    if (error.message === 'Network Error') return 'Unable to connect to the server. Please check your connection.';
    return error.message;
  }
  return fallback;
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('sympohub_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredUserId = () => {
  const u = getStoredUser();
  return u?.id || u?._id || null;
};

export const authApi = {
  login: (payload) => api.post('/students/login', payload).then((r) => r.data),
  register: (payload) => {
    const { fullName, ...rest } = payload || {};
    const body = { ...rest };
    if (!body.name && fullName) body.name = fullName;
    return api.post('/students/register', body).then((r) => r.data);
  },
  getMe: async () => {
    const id = getStoredUserId();
    if (!id) throw new Error('No logged-in user.');
    const data = await api.get(`/students/${id}`).then((r) => r.data);
    return data?.student || data?.user || data;
  },
  updateProfile: async (payload) => {
    const id = getStoredUserId();
    if (!id) throw new Error('No logged-in user.');
    const data = await api.put(`/students/${id}`, payload).then((r) => r.data);
    return data?.student || data?.user || data;
  },
};

export const eventsApi = {
  getAll: (params = {}) => api.get('/events', { params }).then((r) => r.data),
  getById: (id) => api.get(`/events/${id}`).then((r) => r.data),
  getFeatured: (params = {}) => api.get('/events', { params: { type: 'featured', ...params } }).then((r) => r.data),
  getCategories: async () => {
    try {
      const data = await api.get('/events/categories').then((r) => r.data);
      const list = data?.categories || data?.data?.categories || data;
      if (Array.isArray(list)) return list;
    } catch {
      // fallback to client-side counting below
    }
    const data = await api.get('/events', { params: { limit: 100 } }).then((r) => r.data);
    const list = Array.isArray(data) ? data : data?.events || data?.data || [];
    const counts = {};
    list.forEach((e) => {
      const c = e.category || e.type;
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  },
};

const normalizeRegistration = (r) => {
  if (!r || typeof r !== 'object') return r;
  const ev = r.event || r.eventId || r.eventDetails || null;
  const evObj = ev && typeof ev === 'object' ? ev : null;
  const evId = evObj ? evObj._id || evObj.id : typeof ev === 'string' ? ev : r.eventId;
  return {
    ...r,
    event: evObj || r.event || undefined,
    eventId: evId,
    eventTitle: evObj?.title || r.eventTitle,
  };
};

export const registrationsApi = {
  register: (eventId, payload = {}) =>
    api.post('/registrations', { eventId, ...payload }).then((r) => r.data),
  getMine: async () => {
    const id = getStoredUserId();
    if (!id) throw new Error('Please log in to view your events.');
    const data = await api.get(`/registrations/student/${id}`).then((r) => r.data);
    const list = Array.isArray(data) ? data : data?.registrations || data?.data || [];
    return list.map(normalizeRegistration);
  },
  check: async (eventId) => {
    try {
      const list = await registrationsApi.getMine();
      const found = list.some((r) => {
        const eid = r.event?._id || r.event?.id || (typeof r.eventId === 'object' ? r.eventId?._id : r.eventId);
        return String(eid) === String(eventId);
      });
      return { registered: found };
    } catch (err) {
      throw err;
    }
  },
  cancel: (id) => api.delete(`/registrations/${id}`).then((r) => r.data),
};

const normalizeCertificate = (c) => {
  if (!c || typeof c !== 'object') return c;
  const ev = c.event || c.eventId || null;
  const evObj = ev && typeof ev === 'object' ? ev : null;
  return {
    ...c,
    event: evObj || c.event || undefined,
    eventTitle: evObj?.title || c.eventTitle || c.title,
  };
};

export const certificatesApi = {
  getMine: async () => {
    const id = getStoredUserId();
    if (!id) throw new Error('Please log in to view certificates.');
    const data = await api.get(`/certificates/student/${id}`).then((r) => r.data);
    const list = Array.isArray(data) ? data : data?.certificates || data?.data || [];
    return list.map(normalizeCertificate);
  },
  getById: async (id) => {
    const list = await certificatesApi.getMine();
    return list.find((c) => String(c._id || c.id) === String(id)) || null;
  },
};

export default api;
