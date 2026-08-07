/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"


// 1. Create Context
const AuthContext = createContext(null);

/**
 * Custom Hook to use AuthContext easily in components
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

/**
 * AuthProvider component wrapping the application
 */
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(ACCESS_TOKEN));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state on app start
    useEffect(() => {
        const storedToken = localStorage.getItem(ACCESS_TOKEN);
        if (storedToken) {
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    /**
     * Handle login: store token and update state
     */
    const login = (accessToken, refreshToken) => {
        localStorage.setItem(ACCESS_TOKEN, accessToken);
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN, refreshToken);
        }
        setToken(accessToken);
    };

    /**
     * Handle logout: clear local storage and reset state
     */
    const logout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        setToken(null);
        setUser(null);
    };

    // Check if user is authenticated (if token exists the user is authenticated)
    const isAuthenticated = !!token;


    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};