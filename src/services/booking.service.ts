import { API_BASE_URL } from '@/lib/api';
const API_URL = `${API_BASE_URL}/bookings`;

export const bookingService = {
    getPatientBookings: async (patientId: string, token: string) => {
        const response = await fetch(`${API_URL}/patient/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.json();
    },

    getLabBookings: async (labId: string, token: string) => {
        const response = await fetch(`${API_URL}/lab/${labId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.json();
    },
};
