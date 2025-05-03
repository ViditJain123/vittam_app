// Generate a random 10-character User ID including letters, numbers, and special characters
export const generateUserId = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Validate phone number (basic validation for 10-digit numbers)
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

// Validate email address
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Format currency as INR
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Generate a random transaction ID
export const generateTransactionId = (): string => {
  return 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Format date to readable format
export const formatDate = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Add default export to fix the warning
const helpers = {
  generateUserId,
  isValidPhoneNumber,
  isValidEmail,
  formatCurrency,
  generateTransactionId,
  formatDate
};

export default helpers;