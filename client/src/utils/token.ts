// Token management utilities
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Decode JWT token (simple base64 decode, không verify signature)
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const tokenUtils = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasToken: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Lấy thông tin user từ JWT token
  getUserFromToken: (): { sub: number; email: string; fullName: string; roles: string[] } | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    const decoded = decodeJWT(token);
    if (!decoded) return null;

    return {
      sub: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      roles: decoded.roles || [],
    };
  },

  // Lấy role chính của user (role đầu tiên)
  getUserRole: (): string | null => {
    const user = tokenUtils.getUserFromToken();
    if (!user || !user.roles || user.roles.length === 0) return null;
    return user.roles[0];
  },
};


