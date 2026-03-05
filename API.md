# API Reference - Auth Service

Base URL: `http://localhost:3001/api/v1` (Development)

## Authentication

### Register
Register a new user account.

- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Rate Limit**: 3 requests / minute
- **Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "User registered successfully",
    "userId": "uuid-string"
  }
  ```

### Login
Authenticate with email and password.

- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Rate Limit**: 5 requests / minute
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200)**:
  ```json
  {
    "access_token": "jwt-token-string",
    "refresh_token": "opaque-token-string",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid-string",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "STUDENT",
      "avatarUrl": null
    }
  }
  ```

### Refresh Token
Get a new access token using a valid refresh token.

- **Endpoint**: `POST /auth/refresh`
- **Access**: Public
- **Body**:
  ```json
  {
    "refresh_token": "opaque-token-string"
  }
  ```
- **Response (200)**:
  ```json
  {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",
    "token_type": "Bearer",
    "expires_in": 900
  }
  ```

### Logout
Invalidate the current session (access & refresh tokens).

- **Endpoint**: `POST /auth/logout`
- **Access**: Protected (Bearer Token)
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

## Email Verification & OTP

### Verify Email
Verify user email address using the OTP sent during registration.

- **Endpoint**: `POST /auth/verify-email`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

### Resend OTP
Resend verification or password reset OTP.

- **Endpoint**: `POST /auth/resend-otp`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "type": "VERIFY_EMAIL" // or "RESET_PASSWORD"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

## Password Management

### Forgot Password
Initiate password reset flow.

- **Endpoint**: `POST /auth/forgot-password`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "If this email is registered, an OTP has been sent."
  }
  ```

### Reset Password
Complete password reset using OTP.

- **Endpoint**: `POST /auth/reset-password`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Password reset successful"
  }
  ```

### Change Password
Change password for logged-in user.

- **Endpoint**: `PATCH /auth/change-password`
- **Access**: Protected (Bearer Token)
- **Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

## User Profile

### Get Profile
Get current user's profile information.

- **Endpoint**: `GET /auth/me`
- **Access**: Protected (Bearer Token)
- **Response (200)**:
  ```json
  {
    "id": "uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "STUDENT",
    "isEmailVerified": true,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
  ```

### Update Profile
Update user profile details.

- **Endpoint**: `PATCH /auth/me`
- **Access**: Protected (Bearer Token)
- **Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
  ```
- **Response (200)**: Updated user object.

## OAuth2

### Google Login
Initiate Google OAuth flow.
- **Endpoint**: `GET /auth/google`
- **Response**: Redirects to Google Consent Screen.

### GitHub Login
Initiate GitHub OAuth flow.
- **Endpoint**: `GET /auth/github`
- **Response**: Redirects to GitHub Consent Screen.

## System

### Health Check
Check service status.
- **Endpoint**: `GET /health`
- **Response (200)**:
  ```json
  {
    "status": "ok",
    "db": "connected",
    "redis": "connected",
    "version": "1.0.0",
    "timestamp": "..."
  }
  ```

### JWKS
Get public keys for JWT verification (for other services).
- **Endpoint**: `GET /auth/.well-known/jwks.json`
- **Response (200)**: JSON Web Key Set.
