export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validatePhone(phone: string): boolean {
  // Simple validation for Indian and general phone formats
  const re = /^[+]?[0-9]{10,13}$/;
  return re.test(phone);
}
