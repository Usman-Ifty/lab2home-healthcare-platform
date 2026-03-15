import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// PRODUCT ENDPOINTS
// ============================================

export const getAllProducts = async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
    sortBy?: string;
    includeInactive?: boolean;
}) => {
    const response = await axios.get(`${API_URL}/marketplace/products`, { params });
    return response.data;
};

export const getProductById = async (id: string) => {
    const response = await axios.get(`${API_URL}/marketplace/products/${id}`);
    return response.data;
};

export const getProductsByCategory = async (category: string, params?: { page?: number; limit?: number }) => {
    const response = await axios.get(`${API_URL}/marketplace/products/category/${category}`, { params });
    return response.data;
};

export const getFeaturedProducts = async (limit?: number) => {
    const response = await axios.get(`${API_URL}/marketplace/featured`, { params: { limit } });
    return response.data;
};

// ============================================
// CART ENDPOINTS
// ============================================

export const getCart = async (token: string) => {
    const response = await axios.get(`${API_URL}/marketplace/cart`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const addToCart = async (token: string, productId: string, quantity: number = 1) => {
    const response = await axios.post(
        `${API_URL}/marketplace/cart`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const updateCartItem = async (token: string, productId: string, quantity: number) => {
    const response = await axios.put(
        `${API_URL}/marketplace/cart/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const removeFromCart = async (token: string, productId: string) => {
    const response = await axios.delete(`${API_URL}/marketplace/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const clearCart = async (token: string) => {
    const response = await axios.delete(`${API_URL}/marketplace/cart`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// ============================================
// WISHLIST ENDPOINTS
// ============================================

export const getWishlist = async (token: string) => {
    const response = await axios.get(`${API_URL}/marketplace/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const addToWishlist = async (token: string, productId: string) => {
    const response = await axios.post(
        `${API_URL}/marketplace/wishlist`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const removeFromWishlist = async (token: string, productId: string) => {
    const response = await axios.delete(`${API_URL}/marketplace/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const moveWishlistToCart = async (token: string, productId: string) => {
    const response = await axios.post(
        `${API_URL}/marketplace/wishlist/move-to-cart`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// ============================================
// ORDER ENDPOINTS
// ============================================

export const createOrder = async (
    token: string,
    orderData: {
        shippingAddress: {
            fullName: string;
            phone: string;
            addressLine1: string;
            addressLine2?: string;
            city: string;
            state: string;
            postalCode: string;
        };
        paymentMethod: string;
        notes?: string;
    }
) => {
    const response = await axios.post(`${API_URL}/marketplace/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getMyOrders = async (token: string, params?: { page?: number; limit?: number; status?: string }) => {
    const response = await axios.get(`${API_URL}/marketplace/orders`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getOrderById = async (token: string, id: string) => {
    const response = await axios.get(`${API_URL}/marketplace/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const cancelOrder = async (token: string, id: string, reason?: string) => {
    const response = await axios.put(
        `${API_URL}/marketplace/orders/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// ============================================
// ADMIN PRODUCT ENDPOINTS
// ============================================

export const createProduct = async (token: string, formData: FormData) => {
    const response = await axios.post(`${API_URL}/marketplace/admin/products`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const updateProduct = async (token: string, id: string, formData: FormData) => {
    const response = await axios.put(`${API_URL}/marketplace/admin/products/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteProduct = async (token: string, id: string) => {
    const response = await axios.delete(`${API_URL}/marketplace/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const toggleProductStatus = async (token: string, id: string) => {
    const response = await axios.put(
        `${API_URL}/marketplace/admin/products/${id}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// ============================================
// ADMIN ORDER ENDPOINTS
// ============================================

export const getAllOrders = async (
    token: string,
    params?: { status?: string; page?: number; limit?: number; search?: string }
) => {
    const response = await axios.get(`${API_URL}/marketplace/admin/orders`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateOrderStatus = async (
    token: string,
    id: string,
    status: string,
    courierService?: string,
    trackingNumber?: string
) => {
    const response = await axios.put(
        `${API_URL}/marketplace/admin/orders/${id}/status`,
        { status, courierService, trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const processRefund = async (token: string, id: string, reason?: string) => {
    const response = await axios.post(
        `${API_URL}/marketplace/admin/orders/${id}/refund`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};
