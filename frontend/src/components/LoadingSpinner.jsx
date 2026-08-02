import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Component
 * 
 * @param {string} size - Size of the spinner: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} text - Optional text to display alongside/below the spinner
 * @param {boolean} fullPage - If true, displays the spinner centered as a full-screen overlay
 */
const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  fullPage = false, 
}) => {
  // Size mapping for the icon
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // Text size mapping according to spinner size
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  // Main Spinner Content
  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center gap-3`}>
      <Loader2 
        className={`${sizeClasses[size] || sizeClasses.md} text-blue-600 animate-spin`} 
      />
      {text && (
        <p className={`${textSizeClasses[size] || textSizeClasses.md} font-medium text-slate-600 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  // Full screen centered layout
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center min-w-45">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;