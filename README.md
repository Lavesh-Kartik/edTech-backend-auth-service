# Auth Service - AI Teaching Platform

The **Auth Service** is the central identity authority for the AI Teaching Platform (ATP). It handles user registration, authentication (JWT RS256), OAuth2 integration (Google, GitHub), session management, and profile updates. Built with **NestJS**, **Prisma**, **PostgreSQL**, and **Redis**.

## Features

- **Authentication**:
  - Email/Password registration and login.
  - JWT RS256 Access Tokens & Opaque Refresh Tokens.
  - OAuth2 Social Login (Google, GitHub).
  - Secure Password Hashing (Bcrypt).
- **Security**:
  - Role-Based Access Control (RBAC).
  - Rate Limiting (Redis-based).
  - CSRF Protection for OAuth flows.
  - HTTP Security Headers (Helmet).
- **Session Management**:
  - Refresh Token Rotation.
  - Remote Session Revocation.
  - Redis-backed token blacklisting.
- **Email & OTP**:
  - Email Verification via OTP.
  - Password Reset flows.
  - Transactional Emails via SendGrid.

## Prerequisites

- **Node.js**: >= 20.0.0
- **PostgreSQL**: >= 13
- **Redis**: >= 6

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd auth-service
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Generate RSA Keys**:
    This service uses RS256 for JWT signing. You need to generate a private/public key pair.
    ```bash
    npm run generate:keys
    ```
    This script will create `keys/private.pem` and `keys/public.pem` and print the base64-encoded values to the console for your `.env` file.

## Configuration

1.  **Environment Variables**:
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```

2.  **Update `.env`**:
    Fill in the required values, especially:
    - `DATABASE_URL`: Your PostgreSQL connection string.
    - `REDIS_URL`: Your Redis connection string.
    - `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`: Paste the output from `npm run generate:keys`.
    - `SENDGRID_API_KEY`: Your SendGrid API Key.
    - `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID`: OAuth credentials.

3.  **Database Setup**:
    Run Prisma migrations to create tables:
    ```bash
    npx prisma migrate dev
    ```

## Running the Application

### Development
```bash
npm run start:dev
```
The server will start on `http://localhost:3001` (or the PORT defined in `.env`).

### Production
```bash
npm run build
npm run start:prod
```

## Testing

### Unit Tests
```bash
npm run test
```

### End-to-End (E2E) Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Deployment (Vercel)

This service is optimized for Vercel Serverless deployment.

1.  **Install Vercel CLI**: `npm i -g vercel`
2.  **Login**: `vercel login`
3.  **Deploy**:
    ```bash
    vercel --prod
    ```
4.  **Environment Variables**: Ensure all `.env` variables are added to your Vercel project settings.

## Project Structure

```
auth-service/
├── api/                 # Vercel serverless entry point
├── src/
│   ├── auth/            # Auth logic (Login, Register, OAuth)
│   ├── common/          # Guards, Decorators, Filters, Interceptors
│   ├── config/          # Configuration namespaces & validation
│   ├── mailer/          # SendGrid integration
│   ├── otp/             # OTP generation & verification
│   ├── prisma/          # Database module
│   ├── redis/           # Redis module
│   ├── tokens/          # JWT & Refresh Token management
│   ├── users/           # User management
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application bootstrap
├── prisma/              # Database schema & migrations
├── test/                # E2E tests
└── vercel.json          # Vercel configuration
```

## API Documentation

For detailed API documentation, including endpoints, request/response formats, and examples, please refer to [API.md](./API.md).

In development mode, you can also access the interactive Swagger UI at:
`http://localhost:3001/docs`
