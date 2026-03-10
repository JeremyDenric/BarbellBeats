/**
 * useFormValidation — reusable form state + validation hook.
 *
 * Tracks field values, touched state, and per-field errors.
 * Validators run on blur and on submit attempt.
 *
 * Usage:
 *   const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } =
 *     useFormValidation(
 *       { email: '', password: '' },
 *       { email: validateEmail, password: validatePassword }
 *     );
 */

import { useState, useCallback, useMemo } from 'react';
import type { ValidationResult } from '../utils/validation';

type Validator<T> = (value: T) => ValidationResult;

type FormValues = Record<string, string>;
type FormValidators<T extends FormValues> = {
  [K in keyof T]?: Validator<string>;
};
type FormErrors<T extends FormValues> = {
  [K in keyof T]?: string;
};
type FormTouched<T extends FormValues> = {
  [K in keyof T]?: boolean;
};

interface UseFormValidationReturn<T extends FormValues> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  handleChange: (field: keyof T, value: string) => void;
  handleBlur: (field: keyof T) => void;
  /** Runs all validators, marks all fields touched. Returns true if valid. */
  validate: () => boolean;
  isValid: boolean;
  reset: () => void;
}

export function useFormValidation<T extends FormValues>(
  initialValues: T,
  validators: FormValidators<T>
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});

  const runValidator = useCallback(
    (field: keyof T, value: string): string | undefined => {
      const validator = validators[field];
      if (!validator) return undefined;
      const result = validator(value);
      return result.isValid ? undefined : result.error;
    },
    // validators is a stable reference passed at hook init
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleChange = useCallback(
    (field: keyof T, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Re-validate on change once the field has been touched
      setTouched((prev) => {
        if (!prev[field]) return prev;
        const error = runValidator(field, value);
        setErrors((e) => ({ ...e, [field]: error }));
        return prev;
      });
    },
    [runValidator]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = runValidator(field, values[field] ?? '');
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [runValidator, values]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    const allTouched: FormTouched<T> = {};
    let valid = true;

    for (const field of Object.keys(initialValues) as (keyof T)[]) {
      allTouched[field] = true;
      const error = runValidator(field, values[field] ?? '');
      if (error) {
        newErrors[field] = error;
        valid = false;
      }
    }

    setTouched(allTouched);
    setErrors(newErrors);
    return valid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runValidator, values]);

  const isValid = useMemo(() => {
    return Object.keys(initialValues).every((field) => {
      const validator = validators[field as keyof T];
      if (!validator) return true;
      return validator(values[field as keyof T] ?? '').isValid;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { values, errors, touched, handleChange, handleBlur, validate, isValid, reset };
}
