import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';
import { User, UserRole } from '../types';
import { toast } from '../components/common/Toaster';

// --- STEP 1: Create a Broadcast Channel ---
// This acts like a private radio frequency for our app's tabs.
const authChannel = new BroadcastChannel('auth_channel');

interface DecodedToken {
  exp: number;
  sub: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken) {
        try {
          const decodedToken: DecodedToken = jwtDecode(currentToken);
          if (decodedToken.exp * 1000 > Date.now()) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
            const response = await apiClient.get('/api/users/me');
            setUser(response.data);
          } else {
            // Token expired, perform a clean logout
            logout(false); // Pass false to not broadcast, as other tabs will also expire
          }
        } catch (error) {
          console.error("Failed to initialize auth state:", error);
          logout(false);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [token]);

  // --- STEP 2: Add an effect to listen for messages from other tabs ---
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      console.log("Auth message received in another tab:", event.data.type);
      if (event.data.type === 'LOGOUT') {
        // Another tab logged out. This tab must also log out.
        setUser(null);
        setToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      if (event.data.type === 'LOGIN') {
        // Another tab logged in. This tab must sync to the new user.
        setToken(event.data.token);
      }
    };

    // Start listening for messages on our "radio frequency"
    authChannel.addEventListener('message', handleAuthMessage);

    // Cleanup: stop listening when the component is removed
    return () => {
      authChannel.removeEventListener('message', handleAuthMessage);
    };
  }, []); // Empty array ensures this runs only once.

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.append('username', email);
    body.append('password', password);

    try {
        const response = await apiClient.post('/api/login/access-token', body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const newAccessToken = response.data.access_token;
        localStorage.setItem('accessToken', newAccessToken);
        setToken(newAccessToken); // This triggers the useEffect above to fetch user data

        // --- STEP 3: Broadcast the LOGIN message to all other tabs ---
        authChannel.postMessage({ type: 'LOGIN', token: newAccessToken });

    } catch(error: any) {
        const errorMessage = error.response?.data?.detail || 'Invalid email or password';
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
  };

  // The broadcast parameter prevents an infinite loop of logout messages.
  const logout = (broadcast = true) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    delete apiClient.defaults.headers.common['Authorization'];

    // --- STEP 4: Broadcast the LOGOUT message to all other tabs ---
    if (broadcast) {
      authChannel.postMessage({ type: 'LOGOUT' });
    }
  };

  const getToken = () => token;

  return (
    <AuthContext.Provider value={{ user, currentRole: user?.role || null, login, logout, isLoading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}