/**
 * Centralized Storage Utility
 * Handles all session/local storage operations with security best practices
 */

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'lab2home_token',
    USER: 'lab2home_user',
    TOKEN_EXPIRY: 'lab2home_token_expiry',
} as const;

// Token expiration time (24 hours in milliseconds)
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000;

/**
 * Get token from sessionStorage
 * Checks expiration and returns null if expired
 */
export const getToken = (): string | null => {
    try {
        const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        const expiry = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

        if (!token) return null;

        // Check if token is expired
        if (expiry) {
            const expiryTime = parseInt(expiry, 10);
            if (Date.now() > expiryTime) {
                // Token expired, clear it
                clearAuth();
                return null;
            }
        }

        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

/**
 * Set token in sessionStorage with expiration
 */
export const setToken = (token: string): void => {
    try {
        const expiryTime = Date.now() + TOKEN_EXPIRY_TIME;
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    } catch (error) {
        console.error('Error setting token:', error);
    }
};

/**
 * Remove token from sessionStorage
 */
export const removeToken = (): void => {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

/**
 * Get user data from sessionStorage
 */
export const getUser = (): any | null => {
    try {
        const userData = sessionStorage.getItem(STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Set user data in sessionStorage
 */
export const setUser = (userData: any): void => {
    try {
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
        console.error('Error setting user data:', error);
    }
};

/**
 * Remove user data from sessionStorage
 */
export const removeUser = (): void => {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
        console.error('Error removing user data:', error);
    }
};

/**
 * Clear all authentication data
 */
export const clearAuth = (): void => {
    removeToken();
    removeUser();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return getToken() !== null;
};

/**
 * Migrate from localStorage to sessionStorage
 * This is a one-time migration function
 */
export const migrateFromLocalStorage = (): void => {
    try {
        // Check if data exists in localStorage
        const oldToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const oldUser = localStorage.getItem(STORAGE_KEYS.USER);

        // Migrate to sessionStorage
        if (oldToken && !sessionStorage.getItem(STORAGE_KEYS.TOKEN)) {
            setToken(oldToken);
        }

        if (oldUser && !sessionStorage.getItem(STORAGE_KEYS.USER)) {
            sessionStorage.setItem(STORAGE_KEYS.USER, oldUser);
        }

        // Clear old localStorage data
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
        console.error('Error migrating from localStorage:', error);
    }
};

export default {
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    removeUser,
    clearAuth,
    isAuthenticated,
    migrateFromLocalStorage,
};
