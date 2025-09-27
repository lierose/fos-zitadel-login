interface SocialLoginButtonProps {
  provider: 'google' | 'microsoft';
  id: string;
  requestId?: string;
  organization?: string;
  disabled?: boolean;
}

export function SocialLoginButton({ 
  provider, 
  id, 
  requestId, 
  organization, 
  disabled = false 
}: SocialLoginButtonProps) {
  const config = {
    google: {
      name: 'Google',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      providerValue: 'google'
    },
    microsoft: {
      name: 'Microsoft',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M13 1h10v10H13z" />
          <path fill="#7FBA00" d="M1 13h10v10H1z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      ),
      providerValue: 'azure'
    }
  };

  const { name, icon, providerValue } = config[provider];

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center space-x-3 bg-gray-100 border border-gray-200 rounded-lg py-3 px-4 text-gray-400 cursor-not-allowed"
      >
        {icon}
        <span className="text-gray-400">Continue with {name} (Not Configured)</span>
      </button>
    );
  }

  return (
    <form action="/api/auth/idp/redirect" method="POST">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="provider" value={providerValue} />
      <input type="hidden" name="requestId" value={requestId || ""} />
      <input type="hidden" name="organization" value={organization || ""} />
      <button
        type="submit"
        className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors duration-200"
      >
        {icon}
        <span className="text-gray-700 font-medium">Continue with {name}</span>
      </button>
    </form>
  );
}
