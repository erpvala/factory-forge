import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  multiline?: boolean;
  rows?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  helperText,
  disabled = false,
  options,
  multiline = false,
  rows = 3
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputClasses = `
    w-full px-4 py-3 text-base border rounded-lg transition-all
    ${error 
      ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400' 
      : isFocused 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-300 bg-white'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={inputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );
      
      case 'select':
        return (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              required={required}
              disabled={disabled}
              className={`${inputClasses} appearance-none pr-10`}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              <option value="">{placeholder}</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`${inputClasses} pr-12`}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        );
      
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

interface MobileFormProps {
  title: string;
  subtitle?: string;
  fields: FormFieldProps[];
  onSubmit: (data: Record<string, string>) => void;
  submitText?: string;
  loading?: boolean;
  error?: string;
  success?: string;
  onCancel?: () => void;
  cancelText?: string;
}

const MobileOptimizedForm: React.FC<MobileFormProps> = ({
  title,
  subtitle,
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false,
  error,
  success,
  onCancel,
  cancelText = 'Cancel'
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.label]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.label])) {
          newErrors[field.label] = 'Please enter a valid email address';
        }
      }
      
      if (field.type === 'tel' && formData[field.label]) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(formData[field.label])) {
          newErrors[field.label] = 'Please enter a valid phone number';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Form Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field, index) => (
          <FormField
            key={index}
            {...field}
            value={formData[field.label] || ''}
            onChange={(value) => handleFieldChange(field.label, value)}
            error={errors[field.label]}
          />
        ))}

        {/* Form Actions */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              submitText
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export { MobileOptimizedForm, FormField };
export default MobileOptimizedForm;
