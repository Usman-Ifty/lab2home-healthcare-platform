import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import { getToken } from '@/utils/storage';

export interface ReportBooking {
    _id: string;
    tests: Array<{
        _id: string;
        name: string;
        category: string;
        description?: string;
    }>;
    lab: {
        _id: string;
        labName: string;
        email?: string;
        phone?: string;
    };
    bookingDate: string;
    preferredTimeSlot: string;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    reportUrl?: string;
    reportUploadedAt?: string;
    totalAmount: number;
    createdAt: string;
}

/**
 * Get all bookings with reports for a patient
 */
export const getPatientReports = async (patientId: string): Promise<ReportBooking[]> => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/bookings/patient/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.data.success) {
            // Filter only bookings that have reports
            return response.data.data.filter((booking: ReportBooking) =>
                booking.reportUrl && booking.status === 'completed'
            );
        }
        return [];
    } catch (error) {
        console.error('Error fetching patient reports:', error);
        throw error;
    }
};

/**
 * Get report URL for viewing/downloading
 */
export const getReportUrl = (bookingId: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}/api/bookings/${bookingId}/report`;
};

/**
 * Download report as file with correct extension
 */
export const downloadReport = async (bookingId: string, testName: string): Promise<void> => {
    try {
        const token = getToken();
        const url = getReportUrl(bookingId);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        });

        // Get content type from response headers
        const contentType = response.headers['content-type'] || 'application/pdf';

        // Determine file extension based on content type
        let extension = 'pdf';
        if (contentType.includes('png')) {
            extension = 'png';
        } else if (contentType.includes('jpg') || contentType.includes('jpeg')) {
            extension = 'jpg';
        } else if (contentType.includes('pdf')) {
            extension = 'pdf';
        } else if (contentType.includes('image')) {
            // Generic image fallback
            extension = 'png';
        }

        // Create blob link to download with correct content type
        const blob = new Blob([response.data], { type: contentType });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${testName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.click();

        // Clean up
        window.URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error downloading report:', error);
        throw error;
    }
};
