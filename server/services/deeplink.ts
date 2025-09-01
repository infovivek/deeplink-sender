import crypto from 'crypto';

const DEEPLINK_SIGN_SECRET = process.env.DEEPLINK_SIGN_SECRET || 'default_deeplink_secret';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export class DeeplinkService {
  static generateDeeplink(phoneNumber: string, message: string, mediaUrl?: string): string {
    // Format phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp deeplink
    let deeplink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    if (mediaUrl) {
      // Note: WhatsApp Web doesn't support direct media URLs in deeplinks
      // This would typically be handled differently in a real implementation
      deeplink += `&media=${encodeURIComponent(mediaUrl)}`;
    }
    
    return deeplink;
  }

  static generateSignedDeeplink(messageId: string): string {
    // Create a signed URL that expires in 1 hour
    const timestamp = Date.now() + (60 * 60 * 1000); // 1 hour from now
    const payload = `${messageId}:${timestamp}`;
    
    const signature = crypto
      .createHmac('sha256', DEEPLINK_SIGN_SECRET)
      .update(payload)
      .digest('hex');
    
    return `${BASE_URL}/api/deeplink?messageId=${messageId}&t=${timestamp}&s=${signature}`;
  }

  static verifySignedDeeplink(messageId: string, timestamp: string, signature: string): boolean {
    // Check if link has expired
    const now = Date.now();
    const linkTimestamp = parseInt(timestamp);
    
    if (linkTimestamp < now) {
      return false; // Link expired
    }
    
    // Verify signature
    const payload = `${messageId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', DEEPLINK_SIGN_SECRET)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  static validatePhoneNumber(phone: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Add + if not present
    if (!phone.startsWith('+')) {
      return `+${digitsOnly}`;
    }
    
    return phone;
  }
}
