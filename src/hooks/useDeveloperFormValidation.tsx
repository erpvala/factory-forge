// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';

// Validation rule types
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  numeric?: boolean;
  alpha?: boolean;
  alphaNumeric?: boolean;
  custom?: (value: string) => boolean | string;
}

interface ValidationField {
  name: string;
  label: string;
  rules: ValidationRule;
  value: string;
  error?: string;
}

interface FormConfig {
  fields: ValidationField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
}

interface UseFormValidationReturn {
  fields: ValidationField[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  updateField: (name: string, value: string) => void;
  validateField: (name: string) => string | null;
  validateAll: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateNumeric = (value: string): boolean => {
  return /^\d+$/.test(value);
};

const validateAlpha = (value: string): boolean => {
  return /^[a-zA-Z\s]+$/.test(value);
};

const validateAlphaNumeric = (value: string): boolean => {
  return /^[a-zA-Z0-9\s\-_]+$/.test(value);
};

// Form validation hook
const useDeveloperFormValidation = (config: FormConfig): UseFormValidationReturn => {
  const [fields, setFields] = useState<ValidationField[]>(config.fields);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate a single field
  const validateField = useCallback((name: string): string | null => {
    const field = fields.find(f => f.name === name);
    if (!field) return null;

    const value = field.value.trim();
    const rules = field.rules;

    // Required validation
    if (rules.required && !value) {
      return `${field.label} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return null;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return `${field.label} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field.label} must not exceed ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }

    // Email validation
    if (rules.email && !validateEmail(value)) {
      return `${field.label} must be a valid email address`;
    }

    // URL validation
    if (rules.url && !validateUrl(value)) {
      return `${field.label} must be a valid URL`;
    }

    // Numeric validation
    if (rules.numeric && !validateNumeric(value)) {
      return `${field.label} must contain only numbers`;
    }

    // Alpha validation
    if (rules.alpha && !validateAlpha(value)) {
      return `${field.label} must contain only letters`;
    }

    // Alpha numeric validation
    if (rules.alphaNumeric && !validateAlphaNumeric(value)) {
      return `${field.label} must contain only letters, numbers, spaces, hyphens, and underscores`;
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        return typeof customResult === 'string' ? customResult : `${field.label} is invalid`;
      }
    }

    return null;
  }, [fields]);

  // Update field value
  const updateField = useCallback((name: string, value: string) => {
    setFields(prev => prev.map(field => 
      field.name === name ? { ...field, value } : field
    ));

    // Clear error for this field when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, validateField]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && fields.every(field => {
    if (field.rules.required && !field.value.trim()) return false;
    return !errors[field.name];
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: Record<string, string> = {};
      fields.forEach(field => {
        formData[field.name] = field.value.trim();
      });

      await config.onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    setFields(prev => prev.map(field => ({ ...field, value: '', error: undefined })));
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    fields,
    errors,
    isSubmitting,
    isValid,
    updateField,
    validateField,
    validateAll,
    handleSubmit,
    resetForm
  };
};

// Predefined form configurations
export const createProjectFormConfig = (onSubmit: (data: Record<string, string>) => Promise<void>): FormConfig => ({
  fields: [
    {
      name: 'name',
      label: 'Project Name',
      value: '',
      rules: {
        required: true,
        minLength: 3,
        maxLength: 100,
        alphaNumeric: true,
        custom: (value) => {
          if (!/^[a-z]/i.test(value)) {
            return 'Project name must start with a letter';
          }
          return true;
        }
      }
    },
    {
      name: 'description',
      label: 'Description',
      value: '',
      rules: {
        maxLength: 500,
        required: false
      }
    },
    {
      name: 'visibility',
      label: 'Visibility',
      value: 'private',
      rules: {
        required: true,
        custom: (value) => {
          if (!['public', 'private', 'internal'].includes(value)) {
            return 'Visibility must be public, private, or internal';
          }
          return true;
        }
      }
    }
  ],
  onSubmit
});

export const createRepositoryFormConfig = (onSubmit: (data: Record<string, string>) => Promise<void>): FormConfig => ({
  fields: [
    {
      name: 'name',
      label: 'Repository Name',
      value: '',
      rules: {
        required: true,
        minLength: 3,
        maxLength: 100,
        alphaNumeric: true,
        custom: (value) => {
          if (!/^[a-z]/i.test(value)) {
            return 'Repository name must start with a letter';
          }
          return true;
        }
      }
    },
    {
      name: 'description',
      label: 'Description',
      value: '',
      rules: {
        maxLength: 500,
        required: false
      }
    },
    {
      name: 'language',
      label: 'Programming Language',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin'];
          if (!languages.includes(value)) {
            return 'Please select a valid programming language';
          }
          return true;
        }
      }
    },
    {
      name: 'visibility',
      label: 'Visibility',
      value: 'private',
      rules: {
        required: true,
        custom: (value) => {
          if (!['public', 'private', 'internal'].includes(value)) {
            return 'Visibility must be public, private, or internal';
          }
          return true;
        }
      }
    },
    {
      name: 'projectId',
      label: 'Project',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          if (!value || value === '') {
            return 'Please select a project';
          }
          return true;
        }
      }
    }
  ],
  onSubmit
});

export const createCommitFormConfig = (onSubmit: (data: Record<string, string>) => Promise<void>): FormConfig => ({
  fields: [
    {
      name: 'message',
      label: 'Commit Message',
      value: '',
      rules: {
        required: true,
        minLength: 5,
        maxLength: 200,
        custom: (value) => {
          if (!/^[a-z]/i.test(value)) {
            return 'Commit message must start with a letter';
          }
          return true;
        }
      }
    },
    {
      name: 'branch',
      label: 'Branch',
      value: 'main',
      rules: {
        required: true,
        alphaNumeric: true,
        custom: (value) => {
          if (!/^[a-z]/i.test(value)) {
            return 'Branch name must start with a letter';
          }
          return true;
        }
      }
    },
    {
      name: 'authorName',
      label: 'Author Name',
      value: '',
      rules: {
        required: true,
        minLength: 2,
        maxLength: 100,
        alpha: true
      }
    },
    {
      name: 'authorEmail',
      label: 'Author Email',
      value: '',
      rules: {
        required: true,
        email: true
      }
    },
    {
      name: 'repositoryId',
      label: 'Repository',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          if (!value || value === '') {
            return 'Please select a repository';
          }
          return true;
        }
      }
    }
  ],
  onSubmit
});

export const createPipelineFormConfig = (onSubmit: (data: Record<string, string>) => Promise<void>): FormConfig => ({
  fields: [
    {
      name: 'name',
      label: 'Pipeline Name',
      value: '',
      rules: {
        required: true,
        minLength: 3,
        maxLength: 100,
        alphaNumeric: true
      }
    },
    {
      name: 'projectId',
      label: 'Project',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          if (!value || value === '') {
            return 'Please select a project';
          }
          return true;
        }
      }
    },
    {
      name: 'branch',
      label: 'Branch',
      value: 'main',
      rules: {
        required: true,
        alphaNumeric: true
      }
    },
    {
      name: 'commitHash',
      label: 'Commit Hash',
      value: '',
      rules: {
        required: true,
        minLength: 7,
        maxLength: 40,
        alphaNumeric: true,
        custom: (value) => {
          if (!/^[a-f0-9]+$/i.test(value)) {
            return 'Commit hash must contain only hexadecimal characters';
          }
          return true;
        }
      }
    },
    {
      name: 'triggeredBy',
      label: 'Triggered By',
      value: '',
      rules: {
        required: true,
        minLength: 2,
        maxLength: 100,
        alpha: true
      }
    }
  ],
  onSubmit
});

export const createDeploymentFormConfig = (onSubmit: (data: Record<string, string>) => Promise<void>): FormConfig => ({
  fields: [
    {
      name: 'version',
      label: 'Version',
      value: '',
      rules: {
        required: true,
        minLength: 1,
        maxLength: 50,
        custom: (value) => {
          if (!/^[a-z0-9\-\.]+$/i.test(value)) {
            return 'Version must contain only letters, numbers, dots, and hyphens';
          }
          return true;
        }
      }
    },
    {
      name: 'environment',
      label: 'Environment',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          if (!['development', 'staging', 'production'].includes(value)) {
            return 'Environment must be development, staging, or production';
          }
          return true;
        }
      }
    },
    {
      name: 'projectId',
      label: 'Project',
      value: '',
      rules: {
        required: true,
        custom: (value) => {
          if (!value || value === '') {
            return 'Please select a project';
          }
          return true;
        }
      }
    },
    {
      name: 'branch',
      label: 'Branch',
      value: 'main',
      rules: {
        required: true,
        alphaNumeric: true
      }
    },
    {
      name: 'server',
      label: 'Server',
      value: '',
      rules: {
        required: true,
        minLength: 3,
        maxLength: 100,
        alphaNumeric: true
      }
    },
    {
      name: 'deployedBy',
      label: 'Deployed By',
      value: '',
      rules: {
        required: true,
        minLength: 2,
        maxLength: 100,
        alpha: true
      }
    }
  ],
  onSubmit
});

export default useDeveloperFormValidation;
