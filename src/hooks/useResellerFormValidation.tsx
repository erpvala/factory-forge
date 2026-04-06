// @ts-nocheck
import { useState, useCallback } from 'react';

// Validation types
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: string) => string | null;
}

interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

interface FormErrors {
  [fieldName: string]: string;
}

interface FormData {
  [fieldName: string]: string | number | boolean;
}

// Form validation hook
export const useResellerFormValidation = (
  initialData: FormData,
  validationRules: FieldValidation
) => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate single field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value === '')) {
      return `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value === '') return null;

    const stringValue = String(value);

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `${fieldName} must not exceed ${rules.maxLength} characters`;
    }

    // Email validation
    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        return `${fieldName} must be a valid email address`;
      }
    }

    // Phone validation
    if (rules.phone) {
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phonePattern.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
        return `${fieldName} must be a valid phone number`;
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return `${fieldName} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(stringValue);
      if (customError) return customError;
    }

    return null;
  }, [validationRules]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let formIsValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  }, [formData, validationRules, validateField]);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Validate field on change
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
  }, [validateField]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    const error = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
  }, [formData, validateField]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsValid(false);
    setIsSubmitting(false);
  }, [initialData]);

  // Submit form
  const submitForm = useCallback(async (onSubmit: (data: FormData) => Promise<void>) => {
    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return {
    formData,
    errors,
    isSubmitting,
    isValid,
    handleFieldChange,
    handleFieldBlur,
    validateForm,
    resetForm,
    submitForm
  };
};

// Predefined validation rules for common forms
export const ResellerFormValidationRules = {
  // Customer form validation
  customer: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-&.]+$/
    },
    email: {
      required: true,
      email: true
    },
    phone: {
      required: true,
      phone: true
    },
    company: {
      required: false,
      maxLength: 100
    },
    location: {
      required: false,
      maxLength: 200
    }
  },

  // Sale form validation
  sale: {
    customerId: {
      required: true,
      custom: (value: string) => {
        if (!value || value === '') return 'Customer is required';
        if (value === 'select') return 'Please select a customer';
        return null;
      }
    },
    productId: {
      required: true,
      custom: (value: string) => {
        if (!value || value === '') return 'Product is required';
        if (value === 'select') return 'Please select a product';
        return null;
      }
    },
    amount: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) return 'Amount must be greater than 0';
        if (num > 999999) return 'Amount is too large';
        return null;
      }
    }
  },

  // License form validation
  license: {
    customerId: {
      required: true,
      custom: (value: string) => {
        if (!value || value === '') return 'Customer is required';
        if (value === 'select') return 'Please select a customer';
        return null;
      }
    },
    productId: {
      required: true,
      custom: (value: string) => {
        if (!value || value === '') return 'Product is required';
        if (value === 'select') return 'Please select a product';
        return null;
      }
    },
    expiryDate: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        if (date <= today) return 'Expiry date must be in the future';
        return null;
      }
    }
  },

  // Support ticket form validation
  supportTicket: {
    subject: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 2000
    },
    priority: {
      required: true,
      custom: (value: string) => {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(value)) return 'Please select a valid priority';
        return null;
      }
    },
    category: {
      required: true,
      custom: (value: string) => {
        if (!value || value === '') return 'Category is required';
        if (value === 'select') return 'Please select a category';
        return null;
      }
    }
  }
};

export default useResellerFormValidation;
