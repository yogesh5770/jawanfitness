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
You have been appointed to the Jawan Fitness coaching team by the Gym Director. Your official coach portal credentials are ready:

📱 *Coach App:* ${info.portalUrl}
👤 *User ID:* ${info.loginId}
📧 *Email:* ${info.email || 'N/A'}
🔑 *Password:* ${info.temporaryPassword}

👉 *How to log in:*
1. Click the portal link above
2. Enter your User ID and Password
3. Access your assigned client roster, workout programming & diet schedules.

_Jawan Fitness Headquarters • Salem_`;
}

/**
 * Format WhatsApp message for Gym Member (Client)
 */
export function getClientWhatsAppMessage(info: CredentialInfo): string {
  return `💪 *WELCOME TO JAWAN FITNESS!*

Hello *${info.name}*,
Your gym membership portal is now active! Your personal dashboard is ready for tracking workouts and nutrition.

📲 *Member App:* ${info.portalUrl}
👤 *Login ID:* ${info.loginId}
📱 *Registered Mobile:* ${info.phone}
🔑 *Password:* ${info.temporaryPassword}
🏋️ *Assigned Coach:* ${info.assignedCoach || 'Head Coach'}

👉 *How to log in:*
1. Tap the link above
2. Enter your Login ID (or Phone) and Password
3. View your daily workout plan, log your sets, and check your nutrition targets!

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
