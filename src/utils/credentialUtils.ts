/**
 * Jawan Fitness - Credential Generation & WhatsApp Dispatch Utility
 */

export interface CredentialInfo {
  name: string;
  phone: string;
  email?: string;
  role: 'TRAINER' | 'CLIENT';
  loginId: string;
  temporaryPassword: string;
  portalUrl: string;
  assignedCoach?: string;
}

/**
 * Returns the current unified portal URL, falling back to the production Cloudflare Pages deployment
 * when running inside Capacitor Android APK or local development.
 */
export function getUnifiedPortalUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && !origin.includes('localhost') && !origin.includes('capacitor://') && !origin.includes('ionic://') && !origin.startsWith('file:')) {
      return origin;
    }
  }
  return 'https://jawan-fitness-admin.pages.dev';
}

/**
 * Format phone number for WhatsApp direct URL
 * Defaults to +91 (India) if 10-digit number is provided without country code
 */
export function formatWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const cleanNumber = digits.length === 10 ? `91${digits}` : digits;
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
}

/**
 * Format WhatsApp message for Staff Trainer
 */
export function getTrainerWhatsAppMessage(info: CredentialInfo): string {
  return `🏋️ *JAWAN FITNESS — COACH PORTAL ACCESS*

Hello *${info.name}*,
You have been appointed to the Jawan Fitness coaching team by the Gym Director. Your official credentials are ready:

📱 *App & Web Portal:* ${info.portalUrl}
👤 *User ID:* ${info.loginId}
📧 *Email:* ${info.email || 'N/A'}
🔑 *Password:* ${info.temporaryPassword}

👉 *How to log in:*
1. Open the portal link above OR open the Jawan Fitness App (APK/PWA)
2. Slide the top toggle to *Trainer*
3. Enter your User ID and Password
4. Access your client roster, workout programming & diet schedules.

_Jawan Fitness Headquarters • Salem_`;
}

/**
 * Format WhatsApp message for Gym Member (Client)
 */
export function getClientWhatsAppMessage(info: CredentialInfo): string {
  return `💪 *WELCOME TO JAWAN FITNESS!*

Hello *${info.name}*,
Your gym membership portal is now active! Your personal dashboard is ready for tracking workouts and nutrition.

📲 *App & Web Portal:* ${info.portalUrl}
👤 *Login ID:* ${info.loginId}
📱 *Registered Mobile:* ${info.phone}
🔑 *Password:* ${info.temporaryPassword}
🏋️ *Assigned Coach:* ${info.assignedCoach || 'Head Coach'}

👉 *How to log in:*
1. Open the portal link above OR open the Jawan Fitness App (APK/PWA)
2. Slide the top toggle to *Member*
3. Enter your Login ID (or Mobile) and Password
4. View your daily workout plan, log your sets, and check your nutrition targets!

_Jawan Fitness • Salem Headquarters_`;
}

/**
 * Copy text to user clipboard with navigator fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard write failed, attempting fallback', e);
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}
