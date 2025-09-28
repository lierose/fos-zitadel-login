# JWT Authentication Implementation

This document describes the JWT token-based authentication system that has been implemented to replace the traditional session-based authentication.

## Overview

The authentication system has been converted from session-based to JWT (JSON Web Token) based authentication. This provides several benefits:

- **Stateless**: No server-side session storage required
- **Scalable**: Better for distributed systems
- **Secure**: Tokens are cryptographically signed
- **Self-contained**: User information is embedded in the token

## Key Components

### 1. JWT Utilities (`src/lib/jwt.ts`)

Core JWT functionality including:
- `createJWT()`: Creates a new JWT token with user information
- `verifyJWT()`: Verifies and decodes JWT tokens
- `getJWTFromCookies()`: Retrieves JWT from HTTP-only cookies
- `setJWTCookie()`: Sets JWT as HTTP-only cookie
- `clearJWTCookie()`: Removes JWT cookie on logout

### 2. Updated Password Authentication (`src/lib/server/password.ts`)

The `sendPassword()` function has been updated to:
- Authenticate users using Zitadel
- Create JWT tokens instead of sessions
- Set JWT cookies for subsequent requests
- Handle both OIDC and direct login flows

### 3. Profile Page (`src/app/(login)/profile/page.tsx`)

New profile page that:
- Displays user information from JWT token
- Shows token expiration time
- Provides logout functionality
- Uses modern, responsive UI design

### 4. Logout Functionality (`src/app/api/auth/logout/route.ts`)

Updated logout API that:
- Clears JWT cookies
- Removes legacy session cookies
- Returns success response

### 5. Modern UI Components

Updated login and profile pages with:
- Beautiful gradient backgrounds
- Card-based layouts
- Responsive design
- Dark mode support
- Modern typography and spacing

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Zitadel Configuration (existing)
ZITADEL_API_URL=http://localhost:8080
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret
ZITADEL_CALLBACK_URL=http://localhost:3000/api/auth/callback/zitadel
ZITADEL_POST_LOGIN_URL=http://localhost:3000/profile
ZITADEL_SERVICE_USER_TOKEN=your-service-user-token
```

## JWT Token Structure

The JWT tokens contain the following payload:

```typescript
interface JWTPayload {
  userId: string;
  loginName: string;
  organizationId?: string;
  displayName?: string;
  email?: string;
  exp: number;    // Expiration timestamp
  iat: number;    // Issued at timestamp
}
```

## Security Features

1. **HTTP-Only Cookies**: JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
2. **Cryptographic Signing**: Tokens are signed with HMAC-SHA256
3. **Expiration**: Tokens expire after 24 hours by default
4. **Secure Flags**: Cookies use secure flags in production
5. **SameSite Protection**: Cookies use SameSite=Lax for CSRF protection

## Usage Flow

1. **Login**: User enters credentials → Password verified → JWT created → Cookie set → Redirect to profile
2. **Protected Routes**: Middleware checks JWT → Validates token → Allows/denies access
3. **Logout**: User clicks logout → JWT cookie cleared → Redirect to login

## Migration Notes

- The system maintains backward compatibility with existing Zitadel integration
- Legacy session cookies are still cleared during logout
- OIDC flow continues to work with JWT tokens
- All existing authentication methods (password, MFA, etc.) are supported

## Testing

To test the JWT implementation:

1. Start the development server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Enter login credentials
4. Verify JWT token is created and stored
5. Check profile page displays user information
6. Test logout functionality

## Future Enhancements

Potential improvements for the JWT system:

1. **Refresh Tokens**: Implement refresh token rotation
2. **Token Blacklisting**: Add token revocation capability
3. **Multi-device Support**: Handle multiple concurrent sessions
4. **Audit Logging**: Track authentication events
5. **Rate Limiting**: Implement login attempt limiting
