/**
 * Centralized API Configuration
 * All environment variables and API endpoints are defined here
 */

export const API_CONFIG = {
    // Base API URL - defaults to localhost for development
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3021',

    // Auth0 Configuration
    AUTH0: {
        DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
        CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
        AUDIENCE: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
    },

    // API Endpoints
    ENDPOINTS: {
        AUTH: {
            LOGIN_PASSWORD: '/auth/login/password',
            LOGIN_SOCIAL: '/auth/login',
            SIGNUP_EMAIL: '/auth/signup/email',
            SIGNUP_PHONE_REQUEST: '/auth/signup/phone/request',
            SIGNUP_PHONE_VERIFY: '/auth/signup/phone/verify',
            VERIFY_EMAIL: '/auth/email/verify',
            RESEND_OTP: '/auth/email/send-verification',
            REFRESH_TOKEN: '/auth/refresh',
            LOGOUT: '/auth/logout',
            FORGOT_PASSWORD: '/auth/password/forgot',
            RESET_PASSWORD: '/auth/password/reset',
            CHANGE_PASSWORD: '/auth/password/change',
            ME: '/auth/me',
            SWITCH_ORG: '/auth/switch-org',
        },
        PROJECTS: {
            ALL: '/projects/all',
        },
        INVITATIONS: {
            SEND: (orgId: string) => `/invites/send/${orgId}`,
            PENDING: '/invites/pending',
            ACCEPT: '/invites/accept',
            REJECT: '/invites/reject',
            RESEND: (orgId: string) => `/invites/resend/${orgId}`,
        },
        NOTIFICATIONS: {
            LIST: '/notifications',
            UNREAD: '/notifications?status=unread',
            MARK_READ: (id: string) => `/notifications/${id}/read`,
        },
        MESSAGES: {
            LIST: '/messages',
            UNREAD: '/messages?status=unread',
            MARK_READ: (id: string) => `/messages/${id}/read`,
        },
        ORG: {
            SETTINGS: '/org/settings',
            ALL: '/organizations',
        },
        TIMERS: {
            ACTIVE: '/timers/active',
            START: '/timers/start',
            STOP: '/timers/stop',
        },
        ATTENDANCE: {
            TODAY: '/attendance/today',
            ME: '/attendance/me',
            USER: (userId: string) => `/attendance/users/${userId}`,
            CHECK_IN: '/attendance/check-in',
            CHECK_OUT: '/attendance/check-out',
            START_BREAK: '/attendance/start-break',
            END_BREAK: '/attendance/end-break',
        },
        TIME_ENTRIES: {
            LIST: '/time-entries',
            CREATE: '/time-entries',
            UPDATE: (id: string) => `/time-entries/${id}`,
            DELETE: (id: string) => `/time-entries/${id}`,
        },
        TIMESHEETS: {
            MY: '/timesheets/my',
            TEAM: '/timesheets/team',
            SUBMIT: '/timesheets/submit',
            APPROVE: (id: string) => `/timesheets/${id}/approve`,
        },
        TEAMS: {
            LIST: '/teams',
        },
        PRESENCE: {
            UPDATE_STATUS: '/presence/status',
        },
    },

    // WebSocket Configuration
    WEBSOCKET: {
        NAMESPACE: '/notifications',
        PRESENCE_NAMESPACE: '/presence',
    },

    // Token Storage Keys
    STORAGE: {
        ACCESS_TOKEN: 'accessToken',
        REFRESH_TOKEN: 'refreshToken',
        USER: 'user',
    },
} as const;

// Helper to check if Auth0 is configured
export const isAuth0Configured = () => {
    // console.log(API_CONFIG.AUTH0.DOMAIN);
    // console.log(API_CONFIG.AUTH0.CLIENT_ID);
    // console.log(API_CONFIG.AUTH0.AUDIENCE);
    return !!(
        API_CONFIG.AUTH0.DOMAIN &&
        API_CONFIG.AUTH0.CLIENT_ID &&
        API_CONFIG.AUTH0.AUDIENCE
    );
};
