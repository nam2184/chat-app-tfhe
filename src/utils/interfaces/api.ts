
import axios from 'axios';

// Assuming your types for ErrorResponse and ErrorType are as follows
interface ErrorType {
    section: string;
    message: string;
    err?: Error;
}

interface ErrorResponse {
    status: string;
    type: number;
    message: string;
    code: number;
    error: ErrorType;
}

// Create the Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Authorization token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling token expiration and refresh
api.interceptors.response.use(
    (response) => response, // Pass through the response if it's successful
    async (error) => {
        const originalRequest = error.config; // Get the original request that failed

        // If the error is from the server and it's an authorization error (401)
        if (error.response && error.response.status === 401) {
            const errorResponse: ErrorResponse = error.response.data;

            // If the error message indicates the token is expired
            if (errorResponse.message.includes('token expired')) {
                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const refreshResponse = await axios.post('/refresh', {
                            refresh_token: refreshToken,
                        });

                        const { access_token, refresh_token } = refreshResponse.data;
                        localStorage.setItem('access_token', access_token);
                        localStorage.setItem('refresh_token', refresh_token);

                        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                        return axios(originalRequest); // Retry the original request
                    }
                } catch (refreshError) {
                    console.error('Error refreshing token', refreshError);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    window.location.href = '/'; // Redirect to the sign-in page

                    console.error("Failed to refresh the token, redirecting to sign-in.");
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/'; 

                return Promise.reject(error);

            }
        }

        // If it's not a 401 or doesn't relate to token expiration, just reject the error
        return Promise.reject(error);
    }
);

export default api;

