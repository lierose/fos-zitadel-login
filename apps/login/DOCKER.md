# Docker Deployment Guide

This guide explains how to build and run the ZITADEL Login application using Docker.

## Prerequisites

- Docker installed on your system
- Access to the source code
- Environment variables configured

## Environment Setup

1. **Create a `.env` file** in the `apps/login` directory with the following variables:

```bash
NODE_ENV=development
PORT=3000
ZITADEL_API_URL=https://your-zitadel-instance.zitadel.cloud
ZITADEL_SERVICE_USER_TOKEN=your-service-user-token
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CALLBACK_URL=http://localhost:3000/api/auth/callback/zitadel
JWT_SECRET=your-jwt-secret
```

## Building the Docker Image

1. **Navigate to the login directory**:
   ```bash
   cd apps/login
   ```

2. **Build the Docker image**:
   ```bash
   docker build -t zitadel-login .
   ```

   This will create a Docker image named `zitadel-login` with all dependencies and the built application.

## Running the Container

### Basic Run
```bash
docker run -d -p 3003:3000 --name zitadel-login-container zitadel-login
```

### With Environment Variables
```bash
docker run -d -p 3003:3000 --name zitadel-login-container \
  -v $(pwd)/.env:/.env-file/.env \
  zitadel-login
```

### With Custom Port
```bash
docker run -d -p 8080:3000 --name zitadel-login-container \
  -v $(pwd)/.env:/.env-file/.env \
  zitadel-login
```

## Accessing the Application

Once the container is running, you can access the application at:

- **Main Login**: http://localhost:3003/loginname
- **Password Page**: http://localhost:3003/password
- **Accounts Page**: http://localhost:3003/accounts
- **Health Check**: http://localhost:3003/healthy

## Container Management

### Check Container Status
```bash
docker ps | grep zitadel-login
```

### View Logs
```bash
docker logs zitadel-login-container
```

### Stop Container
```bash
docker stop zitadel-login-container
```

### Remove Container
```bash
docker rm zitadel-login-container
```

### Restart Container
```bash
docker restart zitadel-login-container
```

## Troubleshooting

### Container Won't Start
1. Check if the port is already in use:
   ```bash
   lsof -i :3003
   ```
2. Use a different port if needed:
   ```bash
   docker run -d -p 3004:3000 --name zitadel-login-container zitadel-login
   ```

### Environment Variables Not Loading
1. Ensure the `.env` file exists in the `apps/login` directory
2. Check the file permissions
3. Verify the volume mount is correct:
   ```bash
   docker run -d -p 3003:3000 --name zitadel-login-container \
     -v $(pwd)/.env:/.env-file/.env \
     zitadel-login
   ```

### Application Returns 404
1. Check if the container is running:
   ```bash
   docker ps | grep zitadel-login
   ```
2. Check the logs for errors:
   ```bash
   docker logs zitadel-login-container
   ```
3. Verify the health check:
   ```bash
   curl http://localhost:3003/healthy
   ```

## Production Deployment

For production deployment, consider:

1. **Use environment variables instead of .env file**:
   ```bash
   docker run -d -p 3003:3000 --name zitadel-login-container \
     -e NODE_ENV=production \
     -e ZITADEL_API_URL=https://your-production-instance.zitadel.cloud \
     -e ZITADEL_SERVICE_USER_TOKEN=your-production-token \
     -e ZITADEL_CLIENT_ID=your-production-client-id \
     -e JWT_SECRET=your-production-jwt-secret \
     zitadel-login
   ```

2. **Use Docker Compose** for easier management:
   ```yaml
   version: '3.8'
   services:
     zitadel-login:
       build: .
       ports:
         - "3003:3000"
       environment:
         - NODE_ENV=production
         - ZITADEL_API_URL=https://your-production-instance.zitadel.cloud
         - ZITADEL_SERVICE_USER_TOKEN=your-production-token
         - ZITADEL_CLIENT_ID=your-production-client-id
         - JWT_SECRET=your-production-jwt-secret
       restart: unless-stopped
   ```

3. **Use a reverse proxy** (nginx, traefik) for SSL termination and load balancing

## Image Details

- **Base Image**: Node.js 20 Alpine
- **Size**: ~310MB
- **Port**: 3000 (internal)
- **Health Check**: `/healthy` endpoint
- **User**: Non-root user (nextjs:nodejs)

## Support

For issues or questions:
1. Check the container logs
2. Verify environment variables
3. Ensure ZITADEL instance is accessible
4. Check network connectivity
