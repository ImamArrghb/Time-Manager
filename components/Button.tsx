import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean; // <-- Kita tambahkan ini agar tombol mengenali perintah 'disabled'
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button',
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition hover:bg-blue-700 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;