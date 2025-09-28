# ZITADEL Login Application

A modern, responsive login application built with Next.js and ZITADEL for authentication.

## Features

- **Multiple Authentication Methods**:
  - Email/Password login
  - Google OAuth
  - Microsoft OAuth
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Internationalization**: Multi-language support
- **Modern UI/UX**: Clean, professional interface
- **Real-time Notifications**: Top-right notification system
- **JWT Authentication**: Secure token-based authentication

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your ZITADEL configuration
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Access the application**:
   - http://localhost:3002/loginname

### Docker Deployment

See [DOCKER.md](./DOCKER.md) for detailed Docker deployment instructions.

#### Quick Docker Commands

```bash
# Build the image
docker build -t zitadel-login .

# Run the container
docker run -d -p 3003:3000 --name zitadel-login-container \
  -v $(pwd)/.env:/.env-file/.env \
  zitadel-login

# Access the application
open http://localhost:3003/loginname
```

#### Docker Compose

```bash
# Start with Docker Compose
docker-compose up -d

# Stop
docker-compose down
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZITADEL_API_URL` | Your ZITADEL instance URL | Yes |
| `ZITADEL_SERVICE_USER_TOKEN` | Service user token for API access | Yes |
| `ZITADEL_CLIENT_ID` | OAuth client ID | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Port to run the application on | No |

## Project Structure

```
apps/login/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── (login)/         # Login pages group
│   │   │   ├── loginname/   # Username entry page
│   │   │   ├── password/    # Password entry page
│   │   │   ├── accounts/    # Account management
│   │   │   └── idp/         # Identity provider pages
│   │   └── api/             # API routes
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   └── locales/             # Translation files
├── public/                  # Static assets
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
└── DOCKER.md              # Docker deployment guide
```

## Authentication Flow

1. **Username Entry** (`/loginname`):
   - User enters username/email
   - System validates user exists
   - Redirects to password page

2. **Password Verification** (`/password`):
   - User enters password
   - System verifies credentials
   - Creates JWT token and redirects to profile

3. **Social Login**:
   - User clicks Google/Microsoft button
   - Redirects to OAuth provider
   - Returns with authorization code
   - System exchanges code for user info
   - Creates JWT token and redirects to profile

## Customization

### Styling
- Uses Tailwind CSS for styling
- Primary color: `#559775`
- Responsive design with mobile-first approach

### Translations
- Translation files in `src/locales/`
- Supports multiple languages
- Uses `next-intl` for internationalization

### Components
- Modular component architecture
- Reusable UI components
- Custom hooks for state management

## API Endpoints

- `POST /api/auth/idp/redirect` - Handle OAuth redirects
- `GET /healthy` - Health check endpoint

## Development

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
pnpm test:unit    # Run unit tests
```

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks

## Deployment

### Docker
See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

### Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **SSL/TLS**: Use HTTPS in production
3. **Reverse Proxy**: Use nginx or similar for load balancing
4. **Monitoring**: Set up health checks and monitoring
5. **Logging**: Configure proper logging for production

## Troubleshooting

### Common Issues

1. **404 Errors**: Check base path configuration
2. **OAuth Errors**: Verify client ID and secret
3. **Environment Issues**: Check environment variable configuration
4. **Docker Issues**: See DOCKER.md troubleshooting section

### Support

For issues or questions:
1. Check the logs
2. Verify environment configuration
3. Test with development server first
4. Check ZITADEL instance connectivity

## License

This project is licensed under the MIT License.
