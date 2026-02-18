/**
 * Desktop Notification Hook
 * Shows native OS desktop notifications with a custom sound tone
 *
 * Features:
 * - Browser Notification API permission management
 * - Custom notification chime via Web Audio API (no external file needed)
 * - Optional custom audio file support (/sounds/notification.mp3)
 * - Tab-focus awareness (only shows when tab is hidden)
 * - localStorage preference persistence
 * - Click-to-navigate support
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============= Constants =============

const STORAGE_KEYS = {
    DESKTOP_ENABLED: 'teslead_desktop_notifications',
    SOUND_ENABLED: 'teslead_notification_sound',
} as const;

const CUSTOM_AUDIO_PATH = '/sounds/notification.mp3';
const APP_ICON = '/logo/single-logo.png';

// ============= Types =============

export type PermissionStatus = NotificationPermission; // 'default' | 'granted' | 'denied'

export interface DesktopNotificationOptions {
    /** Notification title */
    title: string;
    /** Notification body text */
    body: string;
    /** Optional icon URL (defaults to app logo) */
    icon?: string;
    /** Optional tag to replace existing notifications of the same tag */
    tag?: string;
    /** URL to navigate to on click */
    onClick?: string;
    /** Whether to play sound (overrides global preference) */
    playSound?: boolean;
    /** Whether to force-show even when tab is focused */
    forceShow?: boolean;
}

export interface UseDesktopNotificationReturn {
    /** Current browser permission status */
    permissionStatus: PermissionStatus;
    /** Whether desktop notifications are enabled (user preference) */
    isEnabled: boolean;
    /** Whether sound is enabled (user preference) */
    isSoundEnabled: boolean;
    /** Request browser notification permission */
    requestPermission: () => Promise<NotificationPermission>;
    /** Show a desktop notification with sound */
    showDesktopNotification: (options: DesktopNotificationOptions) => void;
    /** Toggle desktop notifications on/off */
    setEnabled: (enabled: boolean) => void;
    /** Toggle sound on/off */
    setSoundEnabled: (enabled: boolean) => void;
}

// ============= Audio Synthesis =============

/**
 * Synthesize a pleasant notification chime using the Web Audio API.
 * This creates a short two-tone chime that sounds professional —
 * no external audio file required.
 */
function playNotificationChime(): void {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // --- Tone 1: soft ascending note ---
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);

        // --- Tone 2: higher chime ---
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.5);

        // --- Tone 3: harmonic shimmer ---
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15); // E6
        gain3.gain.setValueAtTime(0, ctx.currentTime);
        gain3.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.18);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(ctx.currentTime + 0.15);
        osc3.stop(ctx.currentTime + 0.55);

        // Clean up the context after all tones finish
        setTimeout(() => ctx.close(), 1000);
    } catch {
        // Audio synthesis not available
    }
}

/**
 * Attempt to play a custom audio file, fall back to synthesized chime.
 */
let customAudioAvailable: boolean | null = null; // null = not checked yet

async function playNotificationSound(): Promise<void> {
    // First attempt: try custom audio file
    if (customAudioAvailable !== false) {
        try {
            const audio = new Audio(CUSTOM_AUDIO_PATH);
            audio.volume = 0.5;

            await new Promise<void>((resolve, reject) => {
                audio.oncanplaythrough = () => {
                    customAudioAvailable = true;
                    audio.play().then(resolve).catch(reject);
                };
                audio.onerror = () => reject(new Error('Audio file not found'));
                // Timeout to avoid hanging
                setTimeout(() => reject(new Error('Audio load timeout')), 2000);
            });
            return;
        } catch {
            customAudioAvailable = false;
        }
    }

    // Fallback: synthesized chime
    playNotificationChime();
}

// ============= Helpers =============

function getStoredPreference(key: string, defaultValue: boolean): boolean {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const stored = localStorage.getItem(key);
        return stored !== null ? stored === 'true' : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setStoredPreference(key: string, value: boolean): void {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // localStorage not available
    }
}

function getNotificationTitle(type?: string): string {
    switch (type) {
        case 'INVITE_RECEIVED':
            return '📩 New Invitation';
        case 'INVITE_ACCEPTED':
            return '✅ Invitation Accepted';
        case 'INVITE_REJECTED':
            return '❌ Invitation Declined';
        case 'INVITE_EXPIRED':
            return '⏰ Invitation Expired';
        case 'TASK_ASSIGNED':
            return '📋 Task Assigned';
        case 'TASK_COMPLETED':
            return '🎉 Task Completed';
        default:
            return '🔔 Teslead Notification';
    }
}

// ============= Hook =============

/**
 * Hook: Desktop Notifications with Custom Tone
 *
 * Manages browser notification permissions, user preferences,
 * and shows native OS desktop notifications with sound.
 *
 * @returns Desktop notification controls and state
 *
 * @example
 * ```tsx
 * const { showDesktopNotification, requestPermission, isEnabled } = useDesktopNotification();
 *
 * // Request permission on user action
 * <button onClick={requestPermission}>Enable Notifications</button>
 *
 * // Show a notification
 * showDesktopNotification({
 *   title: 'New Message',
 *   body: 'You have a new notification',
 * });
 * ```
 */
export function useDesktopNotification(): UseDesktopNotificationReturn {
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
    const [isEnabled, setIsEnabledState] = useState(true);
    const [isSoundEnabled, setIsSoundEnabledState] = useState(true);
    const audioWarmedUp = useRef(false);

    // Initialize state from browser + localStorage
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        setPermissionStatus(Notification.permission);
        setIsEnabledState(getStoredPreference(STORAGE_KEYS.DESKTOP_ENABLED, true));
        setIsSoundEnabledState(getStoredPreference(STORAGE_KEYS.SOUND_ENABLED, true));
    }, []);

    // Warm up audio on first user interaction (browser autoplay policy)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const warmUp = () => {
            if (audioWarmedUp.current) return;
            audioWarmedUp.current = true;

            // Create a silent audio context to unlock audio playback
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    const buffer = ctx.createBuffer(1, 1, 22050);
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    source.start();
                    setTimeout(() => ctx.close(), 100);
                }
            } catch {
                // ignore
            }

            // Remove listeners after first interaction
            document.removeEventListener('click', warmUp);
            document.removeEventListener('keydown', warmUp);
        };

        document.addEventListener('click', warmUp, { once: true });
        document.addEventListener('keydown', warmUp, { once: true });

        return () => {
            document.removeEventListener('click', warmUp);
            document.removeEventListener('keydown', warmUp);
        };
    }, []);

    /**
     * Request browser notification permission
     */
    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            return permission;
        } catch {
            return 'denied';
        }
    }, []);

    /**
     * Toggle desktop notifications preference
     */
    const setEnabled = useCallback((enabled: boolean) => {
        setIsEnabledState(enabled);
        setStoredPreference(STORAGE_KEYS.DESKTOP_ENABLED, enabled);
    }, []);

    /**
     * Toggle sound preference
     */
    const setSoundEnabled = useCallback((enabled: boolean) => {
        setIsSoundEnabledState(enabled);
        setStoredPreference(STORAGE_KEYS.SOUND_ENABLED, enabled);
    }, []);

    /**
     * Show a native desktop notification with optional sound
     */
    const showDesktopNotification = useCallback(
        (options: DesktopNotificationOptions) => {
            const {
                title,
                body,
                icon = APP_ICON,
                tag,
                onClick,
                playSound = true,
                forceShow = false,
            } = options;

            // --- Play sound (regardless of Notification API permission) ---
            const shouldPlaySound = playSound && isSoundEnabled;
            if (shouldPlaySound) {
                playNotificationSound().catch(() => {
                    // Silently fail if audio is blocked
                });
            }

            // --- Show desktop notification ---
            if (!('Notification' in window)) return;
            if (!isEnabled) return;
            if (permissionStatus !== 'granted') return;

            // Don't show if tab is focused (unless forced)
            if (!forceShow && !document.hidden) return;

            try {
                const notification = new Notification(title, {
                    body,
                    icon,
                    tag,
                    badge: APP_ICON,
                    silent: true, // We handle our own sound
                });

                if (onClick) {
                    notification.onclick = () => {
                        window.focus();
                        window.location.href = onClick;
                        notification.close();
                    };
                } else {
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                }

                // Auto-close after 6 seconds
                setTimeout(() => notification.close(), 6000);
            } catch {
                // Notification display not available
            }
        },
        [isEnabled, isSoundEnabled, permissionStatus]
    );

    return {
        permissionStatus,
        isEnabled,
        isSoundEnabled,
        requestPermission,
        showDesktopNotification,
        setEnabled,
        setSoundEnabled,
    };
}

// ============= Utility: Map notification type to desktop notification =============

/**
 * Helper to convert an app Notification object into desktop notification options.
 *
 * @param notification - The notification payload from WebSocket
 * @returns DesktopNotificationOptions ready to pass to showDesktopNotification
 */
export function toDesktopNotificationOptions(
    notification: { type?: string; message: string }
): DesktopNotificationOptions {
    return {
        title: getNotificationTitle(notification.type),
        body: notification.message,
        icon: APP_ICON,
        tag: `teslead-${notification.type || 'general'}`,
        onClick: '/notifications',
    };
}
