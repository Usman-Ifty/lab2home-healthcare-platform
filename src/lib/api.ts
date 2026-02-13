// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Import centralized storage utility
import * as storage from '@/utils/storage';

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Re-export storage functions for backward compatibility
export const getToken = storage.getToken;
export const setToken = storage.setToken;
export const removeToken = storage.removeToken;

// Generic API request function
const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log('📤 Request options:', { url, method: options.method, body: options.body });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📥 Response status:', response.status);

    const data = await response.json();
    console.log('📦 Response data:', data);

    return data;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    console.error('URL was:', url);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Unified login - automatically detects patient, lab, or phlebotomist
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Patient login (legacy)
  loginPatient: async (email: string, password: string) => {
    return apiRequest('/auth/login/patient', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Lab login (legacy)
  loginLab: async (email: string, password: string) => {
    return apiRequest('/auth/login/lab', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },

  // Patient signup
  signupPatient: async (data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    age?: number;
    address: string;
    password: string;
  }) => {
    return apiRequest('/auth/signup/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Lab signup (with file upload)
  signupLab: async (data: {
    fullName: string;
    email: string;
    phone: string;
    labName: string;
    licenseCopy: File;
    labAddress: string;
    password: string;
  }) => {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('labName', data.labName);
    formData.append('licenseCopy', data.licenseCopy);
    formData.append('labAddress', data.labAddress);
    formData.append('password', data.password);

    // Don't use apiRequest for file uploads - fetch directly
    const token = storage.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:5000/api/auth/signup/lab', {
      method: 'POST',
      headers,
      body: formData, // Don't set Content-Type - browser will set it with boundary
    });

    return await response.json();
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string, userType: 'patient' | 'lab' | 'phlebotomist') => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, userType }),
    });
  },

  // Resend OTP
  resendOTP: async (email: string, userType: 'patient' | 'lab' | 'phlebotomist') => {
    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    });
  },

  // Phlebotomist signup (with file upload)
  signupPhlebotomist: async (data: {
    fullName: string;
    email: string;
    phone: string;
    qualification: string;
    password: string;
    trafficLicenseCopy: File;
  }) => {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('qualification', data.qualification);
    formData.append('password', data.password);
    formData.append('trafficLicenseCopy', data.trafficLicenseCopy);

    // Don't use apiRequest for file uploads - fetch directly
    const token = storage.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:5000/api/auth/signup/phlebotomist', {
      method: 'POST',
      headers,
      body: formData, // Don't set Content-Type - browser will set it with boundary
    });

    return await response.json();
  },

  // Forgot password - request OTP
  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify reset OTP
  verifyResetOTP: async (email: string, otp: string) => {
    return apiRequest('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};

// Lab API functions
export const updateLabTests = async (labId: string, testIds: string[]): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/labs/${labId}/tests`, {
    method: 'PUT',
    body: JSON.stringify({ testIds }),
  });
};

// ============================================
// NOTIFICATION APIs
// ============================================

export const getUserNotifications = async (userId: string, unreadOnly: boolean = false): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/notifications/${userId}?unreadOnly=${unreadOnly}`);
};

export const markNotificationAsRead = async (notificationId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/notifications/read-all`, {
    method: 'PUT',
    body: JSON.stringify({ userId }),
  });
};

export const deleteNotification = async (notificationId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
};

// ============================================
// LAB APIs
// ============================================

export const fetchAvailableLabs = async (): Promise<ApiResponse<any>> => {
  return apiRequest<any>('/labs/available');
};

export const fetchLabById = async (labId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/labs/${labId}`);
};

// ============================================
// BOOKING APIs
// ============================================

export const createBooking = async (bookingData: {
  patient: string;
  lab: string;
  tests: string[];
  bookingDate: string;
  preferredTimeSlot: string;
  collectionType: 'home' | 'lab';
  collectionAddress?: string;
  notes?: string;
}): Promise<ApiResponse<any>> => {
  return apiRequest<any>('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
};

export const uploadReport = async (bookingId: string, file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('report', file);

  const token = storage.getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/upload-report`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return await response.json();
};

// ============================================
// ADMIN APIs
// ============================================

export const adminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/admin/dashboard/stats');
  },

  getUsers: async (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiRequest<any>(`/admin/users?${queryParams.toString()}`);
  },

  getUserById: async (id: string, userType: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/users/${id}?userType=${userType}`);
  },

  approveUser: async (id: string, userType: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/users/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ userType }),
    });
  },

  suspendUser: async (id: string, userType: string, reason: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/users/${id}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ userType, reason }),
    });
  },

  reactivateUser: async (id: string, userType: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/users/${id}/reactivate`, {
      method: 'PUT',
      body: JSON.stringify({ userType }),
    });
  },

  // Lab management
  getPendingLabs: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/admin/labs/pending');
  },

  getAllLabs: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiRequest<any>(`/admin/labs?${queryParams.toString()}`);
  },

  getLabById: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}`);
  },


  getLabLicense: async (id: string): Promise<Blob> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/labs/${id}/license`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch license');
    }

    return await response.blob();
  },

  approveLab: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectLab: async (id: string, reason: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  editLab: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}/edit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  removeLab: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}`, {
      method: 'DELETE',
    });
  },

  activateLab: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}/activate`, {
      method: 'PUT',
    });
  },

  deactivateLab: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/labs/${id}/deactivate`, {
      method: 'PUT',
    });
  },

  // Phlebotomist management
  getPendingPhlebotomists: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/admin/phlebotomists/pending');
  },

  getAllPhlebotomists: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiRequest<any>(`/admin/phlebotomists?${queryParams.toString()}`);
  },

  getPhlebotomistById: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}`);
  },

  approvePhlebotomist: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectPhlebotomist: async (id: string, reason: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  activatePhlebotomist: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}/activate`, {
      method: 'PUT',
    });
  },

  deactivatePhlebotomist: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}/deactivate`, {
      method: 'PUT',
    });
  },

  editPhlebotomist: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}/edit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  removePhlebotomist: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/phlebotomists/${id}`, {
      method: 'DELETE',
    });
  },

  getPhlebotomistLicense: async (id: string): Promise<Blob> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/phlebotomists/${id}/license`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch traffic license');
    }

    return await response.blob();
  },

  // Patient management
  getAllPatients: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiRequest<any>(`/admin/patients?${queryParams.toString()}`);
  },

  getPatientById: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/patients/${id}`);
  },

  activatePatient: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/patients/${id}/activate`, {
      method: 'PUT',
    });
  },

  deactivatePatient: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/admin/patients/${id}/deactivate`, {
      method: 'PUT',
    });
  },
};

export default apiRequest;
