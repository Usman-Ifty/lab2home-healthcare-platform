// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Import storage utility for token management
import * as storage from '@/utils/storage';

// API Response types
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    count?: number;
}

// Phlebotomist API Service
export const phlebotomistService = {
    /**
     * Get phlebotomist dashboard data with real bookings
     */
    getDashboard: async (): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Get all assigned bookings with optional filters
     * @param filters - Optional status and date filters
     */
    getAssignedBookings: async (filters?: {
        status?: string;
        date?: string;
    }): Promise<ApiResponse> => {
        const token = storage.getToken();
        const queryParams = new URLSearchParams();

        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.date) queryParams.append('date', filters.date);

        const url = `${API_BASE_URL}/phlebotomist/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Get today's bookings
     */
    getTodaysBookings: async (): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist/bookings/today`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    /**
     * Update booking status (in-progress or completed)
     * @param bookingId - Booking ID
     * @param status - New status ('in-progress' or 'completed')
     * @param notes - Optional notes
     */
    updateBookingStatus: async (
        bookingId: string,
        status: 'in-progress' | 'sample_collected' | 'completed',
        notes?: string,
        sampleDetails?: {
            sampleId?: string;
            collectedAt?: Date;
        }
    ): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, notes, sampleDetails }),
        });
        return response.json();
    },

    /**
     * Update phlebotomist availability
     * @param availability - true for available, false for unavailable
     */
    updateAvailability: async (availability: boolean): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist/availability`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ availability }),
        });
        return response.json();
    },

    /**
     * Get performance metrics
     */
    getPerformanceMetrics: async (): Promise<ApiResponse> => {
        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/phlebotomist/metrics`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },
};
