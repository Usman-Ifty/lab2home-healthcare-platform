// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Import storage utility for token management
import * as storage from '@/utils/storage';

// API Response type
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    count?: number;
}

export const phlebotomistRequestService = {
    /**
     * Get available phlebotomists for a specific booking
     * @param bookingId - The ID of the booking
     */
    getAvailablePhlebotomists: async (bookingId: string): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/available-phlebotomists/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Send an assignment request to a phlebotomist
     * @param bookingId - The ID of the booking
     * @param phlebotomistId - The ID of the phlebotomist
     */
    sendRequest: async (bookingId: string, phlebotomistId: string): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookingId, phlebotomistId }),
        });
        return response.json();
    },

    /**
     * Get request history for a booking
     * @param bookingId - The ID of the booking
     */
    getRequestHistory: async (bookingId: string): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/booking/${bookingId}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    getMyRequests: async (): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/my-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Accept an assignment request
     * @param requestId - The ID of the request
     */
    acceptRequest: async (requestId: string): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/${requestId}/accept`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Reject an assignment request
     * @param requestId - The ID of the request
     */
    rejectRequest: async (requestId: string): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist-request/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },
};
