/**
 * Secure Token Storage Manager
 * Handles localStorage with fallbacks and security checks
 */

class TokenStorage {
    private isLocalStorageAvailable(): boolean {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    setToken(key: string, value: string): void {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.error('Failed to set token:', error);
            }
        }
    }

    getToken(key: string): string | null {
        if (this.isLocalStorageAvailable()) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.error('Failed to get token:', error);
                return null;
            }
        }
        return null;
    }

    removeToken(key: string): void {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Failed to remove token:', error);
            }
        }
    }

    clearAll(): void {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Failed to clear storage:', error);
            }
        }
    }
    setUser(user: any): void {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.setItem('user', JSON.stringify(user));
            } catch (error) {
                console.error('Failed to set user:', error);
            }
        }
    }

    getUser(): any | null {
        if (this.isLocalStorageAvailable()) {
            try {
                const userStr = localStorage.getItem('user');
                return userStr ? JSON.parse(userStr) : null;
            } catch (error) {
                console.error('Failed to get user:', error);
                return null;
            }
        }
        return null;
    }

    removeUser(): void {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.removeItem('user');
            } catch (error) {
                console.error('Failed to remove user:', error);
            }
        }
    }
}

export const tokenStorage = new TokenStorage();
