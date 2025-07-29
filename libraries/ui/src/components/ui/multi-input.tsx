'use client';
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface MultiInputTagsProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number | null;
  allowDuplicates?: boolean;
  disabled?: boolean;
}

const MultiInputTags = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter or comma to add tags...',
  className = '',
  maxTags = null,
  allowDuplicates = false,
  disabled = false,
  ...props
}: MultiInputTagsProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    if (!tag.trim()) return;

    const trimmedTag = tag.trim();
    if (!allowDuplicates && value.includes(trimmedTag)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Handle paste with comma-separated values
    if (newValue.includes(',')) {
      const tags = newValue
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      const validTags: string[] = [];

      for (const tag of tags) {
        if (!tag) continue;
        if (!allowDuplicates && value.includes(tag)) continue;
        if (maxTags && value.length + validTags.length >= maxTags) break;
        validTags.push(tag);
      }

      if (validTags.length > 0) {
        onChange([...value, ...validTags]);
      }
      setInputValue('');
      return;
    }

    setInputValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={`
        flex flex-wrap items-center gap-2 min-h-[40px] w-full rounded-lg border 
        ${
          isInputFocused
            ? 'border-gray-500 ring-2 ring-gray-200'
            : 'border-gray-300'
        } 
         px-3 py-2 cursor-text transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        ${className}
      `}
      onClick={handleContainerClick}
    >
      {/* Render existing tags */}
      {value.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="ml-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${tag} tag`}
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}

      {/* Input field */}
      {(!maxTags || value.length < maxTags) && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none bg-transparent placeholder-gray-400 text-sm"
          {...props}
        />
      )}
    </div>
  );
};

export { MultiInputTags };
export type { MultiInputTagsProps };
