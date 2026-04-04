import axios from 'axios';

import { API_BASE_URL } from '@/lib/api';
const API_URL = API_BASE_URL;

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
    targetId: string,
    options?: { booking?: string; order?: string }
) => {
    const params: any = {};
    if (options?.booking) params.booking = options.booking;
    if (options?.order) params.order = options.order;

    const response = await axios.get(`${API_URL}/feedback/check/${targetType}/${targetId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// updateFeedback and deleteFeedback have been removed.
// Reviews are immutable — they cannot be edited or deleted once submitted.
