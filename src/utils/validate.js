export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMobile(mobile) {
  return /^\+?[0-9]{10,15}$/.test(mobile);
}

export function normalizeIdentifier(id) {
  return id.trim().toLowerCase();
}
