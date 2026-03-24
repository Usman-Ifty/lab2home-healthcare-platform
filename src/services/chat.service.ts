const API_URL = 'http://localhost:5000/api/chat';

export const chatService = {
    createConversation: async (targetUserId: string, token: string, targetUserType?: string) => {
        const response = await fetch(`${API_URL}/conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                targetUserId,
                targetUserType: targetUserType || 'patient' // Default to patient for backward compatibility
            }),
        });
        return response.json();
    },

    getConversations: async (token: string) => {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.json();
    },

    getMessages: async (conversationId: string, token: string) => {
        const response = await fetch(`${API_URL}/messages/${conversationId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.json();
    },

    sendMessage: async (conversationId: string, content: string, files: File[], token: string) => {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        if (content) formData.append('content', content);
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        return response.json();
    },

    markAsRead: async (conversationId: string, token: string) => {
        const response = await fetch(`${API_URL}/messages/${conversationId}/read`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.json();
    },

    getAttachmentUrl: (messageId: string, attachmentIndex: number, token: string) => {
        return `${API_URL}/messages/${messageId}/attachments/${attachmentIndex}?token=${token}`; // Token might need to be passed in header if possible, or query param if supported by backend auth middleware (backend auth middleware usually checks header, might need adjustment for direct link access or use blob fetching)
        // For now, let's assume we fetch blob via service or use an authenticated image component.
        // Actually, standard <img> tag won't send header.
        // Best approach for secure images: Fetch blob and create object URL.
    },

    fetchAttachmentBlob: async (messageId: string, attachmentIndex: number, token: string) => {
        const response = await fetch(`${API_URL}/messages/${messageId}/attachments/${attachmentIndex}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch attachment');
        return response.blob();
    }
};
