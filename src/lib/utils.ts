import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_CONFIG } from './config';

/**
 * Get full file/attachment URL (prepends API_CONFIG.BASE_URL if relative path)
 */
export function getFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
}

/**
 * Triggers a force download for a file URL rather than opening in a new browser tab.
 */
export async function downloadFile(fileUrl: string | null | undefined, fileName: string): Promise<void> {
  if (!fileUrl) return;
  const resolved = getFileUrl(fileUrl);
  const cleanName = fileName || 'download';

  // 1. Data URLs can be downloaded directly
  if (resolved.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = resolved;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Fetch blob & trigger blob URL download (Same-Origin blob: URL prevents navigation)
  try {
    const response = await fetch(resolved, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    return;
  } catch (err) {
    console.warn('Direct fetch failed for file download, attempting canvas/img fallback:', err);
  }

  // 3. Offscreen canvas fallback for image files if fetch is blocked
  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(resolved) || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(cleanName);
  if (isImage) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject('Image load failed');
        img.src = resolved;
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = cleanName.endsWith('.png') ? cleanName : `${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (err) {
      console.warn('Canvas image download fallback failed:', err);
    }
  }

  // 4. Hidden iframe fallback to prevent full-page navigation
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = resolved;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  } catch {
    window.open(resolved, '_blank');
  }
}

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return date < new Date();
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'bg-green-500',
    'in-progress': 'bg-blue-500',
    testing: 'bg-yellow-500',
    completed: 'bg-green-600',
    overdue: 'bg-red-500',
    pending: 'bg-gray-500',
  };
  return statusMap[status.toLowerCase()] || 'bg-gray-500';
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  const priorityMap: Record<string, string> = {
    high: 'text-red-500',
    medium: 'text-orange-500',
    low: 'text-green-500',
  };
  return priorityMap[priority.toLowerCase()] || 'text-gray-500';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a consistent color based on a string (e.g., user name)
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
  ];

  let hash = 0;
  if (!name) return colors[0];

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
