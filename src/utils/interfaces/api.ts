import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    AxiosError
} from 'axios';

// Constants for token keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface ErrorType {
    section: string;
    message: string;
    err?: Error;
}

export interface ErrorResponse {
    status: string;
    type: number;
    message: string;
    code: number;
    error: ErrorType;
}

export interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
}

const api: AxiosInstance = axios.create({
    baseURL: 'https://khanhmychattypi.win/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

const refreshAccessToken = async (): Promise<RefreshTokenResponse | null> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
        const response = await axios.post<RefreshTokenResponse>('/refresh', {
            refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        return { access_token, refresh_token };
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
};

api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,

    async (error: AxiosError): Promise<unknown> => {
        const originalRequest = error.config;

        const responseData = error.response?.data as Partial<ErrorResponse>;

        const isUnauthorized = error.response?.status === 401;
        const isTokenExpired = responseData?.message?.includes('token expired');

        if (isUnauthorized && isTokenExpired && originalRequest) {
            const tokens = await refreshAccessToken();

            if (tokens && originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${tokens.access_token}`;
                return api(originalRequest); // Retry original request
            }

            // Redirect if refresh fails
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            window.location.href = '/';
            return Promise.reject(new Error('Session expired. Redirecting.'));
        }

        if (isUnauthorized) {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default api;

