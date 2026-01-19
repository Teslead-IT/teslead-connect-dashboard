/**
 * Invitation Error Handler
 * Centralized error handling for invitation operations
 */

import type { AxiosError } from 'axios';

export interface InvitationError {
    statusCode: number;
    message: string;
    error?: string;
    details?: any;
}

/**
 * Get user-friendly error message from invitation API error
 */
export function getInvitationErrorMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred';

    const axiosError = error as AxiosError<InvitationError>;

    // Network error
    if (!axiosError.response) {
        return 'Network error. Please check your connection.';
    }

    const { status, data } = axiosError.response;

    // Use server message if available
    if (data?.message) {
        return data.message;
    }

    // Fallback based on status code
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'You need to be logged in to perform this action.';
        case 403:
            return "You don't have permission to perform this action.";
        case 404:
            return 'Invitation not found or has expired.';
        case 409:
            return 'This user has already been invited.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}

/**
 * Check if error is due to expired invitation
 */
export function isExpiredInvitationError(error: unknown): boolean {
    const axiosError = error as AxiosError<InvitationError>;
    return (
        axiosError.response?.status === 400 &&
        axiosError.response?.data?.message?.toLowerCase().includes('expired')
    );
}

/**
 * Check if error is due to permission issues
 */
export function isPermissionError(error: unknown): boolean {
    const axiosError = error as AxiosError<InvitationError>;
    return axiosError.response?.status === 403;
}

/**
 * Check if error is due to duplicate invitation
 */
export function isDuplicateInvitationError(error: unknown): boolean {
    const axiosError = error as AxiosError<InvitationError>;
    return axiosError.response?.status === 409;
}

/**
 * Format invitation error for display
 */
export function formatInvitationError(
    error: unknown,
    defaultMessage = 'Something went wrong'
): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
} {
    if (isExpiredInvitationError(error)) {
        return {
            title: 'Invitation Expired',
            message: 'This invitation has expired. Please request a new one.',
            type: 'warning',
        };
    }

    if (isPermissionError(error)) {
        return {
            title: 'Permission Denied',
            message: 'You don\'t have permission to perform this action.',
            type: 'error',
        };
    }

    if (isDuplicateInvitationError(error)) {
        return {
            title: 'Already Invited',
            message: 'This user has already been invited to the organization.',
            type: 'info',
        };
    }

    return {
        title: 'Error',
        message: getInvitationErrorMessage(error) || defaultMessage,
        type: 'error',
    };
}
