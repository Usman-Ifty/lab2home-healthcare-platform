const API_URL = 'http://localhost:5000/api/bookings';

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
