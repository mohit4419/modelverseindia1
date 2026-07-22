/**
 * Application-level phone number validation helper
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Standard E.164 phone validation: Optional +, followed by 7 to 15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(phone.trim().replace(/[\s-()]/g, ''));
}
