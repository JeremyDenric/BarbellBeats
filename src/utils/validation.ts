/**
 * Form Validation Utilities
 * Centralized validation functions for consistent error messages
 */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Validate text field (general purpose)
 */
export function validateTextField(
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const {
    required = false,
    minLength = 0,
    maxLength = 1000,
    fieldName = 'Field',
  } = options;

  const trimmed = value.trim();

  if (required && !trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (trimmed && trimmed.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validate name field
 */
export function validateName(name: string): ValidationResult {
  return validateTextField(name, {
    required: true,
    minLength: 2,
    maxLength: 50,
    fieldName: 'Name',
  });
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate password — rules match server-side requirements.
 * Requires: ≥8 chars, uppercase letter, lowercase letter, number.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 100) {
    return { isValid: false, error: 'Password is too long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain an uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain a lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain a number' };
  }

  return { isValid: true };
}

/**
 * Validate number field
 */
export function validateNumber(
  value: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { required = false, min, max, fieldName = 'Number' } = options;

  const trimmed = value.trim();

  if (required && !trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (!trimmed) {
    return { isValid: true };
  }

  const num = Number(trimmed);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDate(dateString: string): ValidationResult {
  if (!dateString.trim()) {
    return { isValid: true }; // Optional field
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  return { isValid: true };
}

/**
 * Validate time string (HH:MM format)
 */
export function validateTime(timeString: string): ValidationResult {
  if (!timeString.trim()) {
    return { isValid: true }; // Optional field
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return { isValid: false, error: 'Time must be in HH:MM format (24-hour)' };
  }

  return { isValid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // Optional field
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate workout duration (minutes)
 */
export function validateDuration(minutes: string): ValidationResult {
  return validateNumber(minutes, {
    required: false,
    min: 1,
    max: 480, // 8 hours
    fieldName: 'Duration',
  });
}

/**
 * Validate RPE (Rate of Perceived Exertion)
 */
export function validateRPE(rpe: string): ValidationResult {
  return validateNumber(rpe, {
    required: false,
    min: 1,
    max: 10,
    fieldName: 'RPE',
  });
}

/**
 * Validate weight
 */
export function validateWeight(weight: string): ValidationResult {
  return validateNumber(weight, {
    required: false,
    min: 0,
    max: 10000,
    fieldName: 'Weight',
  });
}

/**
 * Validate reps
 */
export function validateReps(reps: string): ValidationResult {
  return validateNumber(reps, {
    required: false,
    min: 1,
    max: 1000,
    fieldName: 'Reps',
  });
}
