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

const getFromStorage = (key: string): string | null => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const removeFromStorage = (key: string): void => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
};

/**
 * Get token from storage
 * Checks expiration and returns null if expired
 */
export const getToken = (): string | null => {
    try {
        const token = getFromStorage(STORAGE_KEYS.TOKEN);
        const expiry = getFromStorage(STORAGE_KEYS.TOKEN_EXPIRY);

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
 * Set token in appropriate storage with expiration
 */
export const setToken = (token: string, rememberMe?: boolean): void => {
    try {
        const expiryTime = Date.now() + TOKEN_EXPIRY_TIME;
        
        // Remove from both first to ensure no conflicts
        removeFromStorage(STORAGE_KEYS.TOKEN);
        removeFromStorage(STORAGE_KEYS.TOKEN_EXPIRY);

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.TOKEN, token);
        storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    } catch (error) {
        console.error('Error setting token:', error);
    }
};

/**
 * Remove token from storage
 */
export const removeToken = (): void => {
    try {
        removeFromStorage(STORAGE_KEYS.TOKEN);
        removeFromStorage(STORAGE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

/**
 * Get user data from storage
 */
export const getUser = (): any | null => {
    try {
        const userData = getFromStorage(STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Set user data in storage
 */
export const setUser = (userData: any, rememberMe?: boolean): void => {
    try {
        removeFromStorage(STORAGE_KEYS.USER);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
        console.error('Error setting user data:', error);
    }
};

/**
 * Remove user data from storage
 */
export const removeUser = (): void => {
    try {
        removeFromStorage(STORAGE_KEYS.USER);
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

// Deprecated: No longer needed as we support both storages via rememberMe
export const migrateFromLocalStorage = (): void => {};

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

