import React, { useState } from 'react';

interface TextInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ placeholder, value, onChange }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Type your message here..."}
      style={{
        width: '100%',
        minHeight: '100px',
        resize: 'vertical',
        padding: '10px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    />
  );
};

export default TextInput;