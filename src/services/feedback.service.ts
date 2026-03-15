import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// PUBLIC FEEDBACK ENDPOINTS
// ============================================

export const getFeedbackForTarget = async (
    targetType: 'lab' | 'phlebotomist' | 'product',
    targetId: string,
    params?: { page?: number; limit?: number }
) => {
    const response = await axios.get(`${API_URL}/feedback/${targetType}/${targetId}`, { params });
    return response.data;
};

export const getRatingStats = async (
    targetType: 'lab' | 'phlebotomist' | 'product',
    targetId: string
) => {
    const response = await axios.get(`${API_URL}/feedback/stats/${targetType}/${targetId}`);
    return response.data;
};

// ============================================
// ADMIN FEEDBACK ENDPOINTS
// ============================================

export const getAllProductReviews = async (token: string, params?: { page?: number; limit?: number }) => {
    const response = await axios.get(`${API_URL}/feedback/admin/products`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ============================================
// PATIENT FEEDBACK ENDPOINTS (Protected)
// ============================================

export const submitFeedback = async (
    token: string,
    data: {
        targetType: 'lab' | 'phlebotomist' | 'product';
        targetId: string;
        rating: number;
        comment?: string;
        booking?: string;
        order?: string;
    }
) => {
    const response = await axios.post(`${API_URL}/feedback`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getMyReviews = async (
    token: string,
    params?: { page?: number; limit?: number; targetType?: string }
) => {
    const response = await axios.get(`${API_URL}/feedback/my-reviews`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const checkExistingFeedback = async (
    token: string,
    targetType: 'lab' | 'phlebotomist' | 'product',
    targetId: string
) => {
    const response = await axios.get(`${API_URL}/feedback/check/${targetType}/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateFeedback = async (
    token: string,
    feedbackId: string,
    data: { rating?: number; comment?: string }
) => {
    const response = await axios.put(`${API_URL}/feedback/${feedbackId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteFeedback = async (token: string, feedbackId: string) => {
    const response = await axios.delete(`${API_URL}/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
