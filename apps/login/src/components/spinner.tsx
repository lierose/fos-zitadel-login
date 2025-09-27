import { FC } from "react";

export const Spinner: FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`${className} relative`}>
      <svg
        role="status"
        className="animate-spin h-12 w-12"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="url(#spinner-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="60 20"
          fill="none"
        />
      </svg>
    </div>
  );
};
