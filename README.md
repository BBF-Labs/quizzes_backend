# BBF Labs Quizzes Backend Documentation

## Overview

BBF Labs Quizzes Backend is a Node.js/Express server application that provides user management functionality with MongoDB database integration. The server implements authentication, session management, and rate limiting.

## Setup and Installation

### Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB instance
- Redis server (for rate limiting)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGO_URI=<your-mongodb-connection-string>
SESSION_SECRET=<your-session-secret>
ACCESS_TOKEN_SECRET=<your-jwt-access-token-secret>
REFRESH_TOKEN_SECRET=<your-jwt-refresh-token-secret>
SALT_ROUNDS=<bcrypt-salt-rounds>
CONFIG_LEVEL=<configuration-level>
```

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Start the server:

```bash
npm start
```

For development with hot reload:

```bash
npm run dev
```

## API Endpoints

### User Management

#### Register New User

```
POST /register
```

Creates a new user account.

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Responses:**

- `201 Created`: User successfully created
  ```json
  {
    "message": "Success",
    "newUser": {
      // User object
    }
  }
  ```
- `400 Bad Request`: Invalid request or user already exists
- `500 Internal Server Error`: Server error

#### Get User Profile

```
GET /profile
```

Retrieves the authenticated user's profile.

**Authentication Required**: Yes

**Responses:**

- `200 OK`: Profile retrieved successfully
  ```json
  {
    "message": "Success",
    "userDoc": {
      // User profile object
    }
  }
  ```
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: User profile not found
- `500 Internal Server Error`: Server error

#### Update User Profile

```
PUT /update
```

Updates the authenticated user's profile information.

**Authentication Required**: Yes

**Request Body:**

```json
{
  // Fields to update
}
```

**Responses:**

- `200 OK`: User updated successfully
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

## Security Features

### Authentication

- JWT-based authentication
- Session management with express-session
- Password hashing with bcrypt
- Rate limiting with express-rate-limit
- Secure headers with helmet

### Middleware

- `authenticateUser`: Verifies user authentication
- `authGuard`: Protects routes from unauthorized access

## Dependencies

### Core Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- passport: Authentication middleware
- jsonwebtoken: JWT implementation
- bcrypt: Password hashing
- redis: Rate limiting and caching
- winston: Logging

### Development Dependencies

- typescript: Static typing
- nodemon: Development server
- ts-node: TypeScript execution
- Various type definitions (@types/\*)

## Error Handling

The application implements centralized error handling with appropriate HTTP status codes:

- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Logging

Winston logger is configured for:

- Console output during development
- Daily rotating file logs in production
- Error tracking and debugging

## Configuration

Different configuration levels are supported through the `LOG_LEVEL` and `NODE_ENV` environment variable:

- Development
- Testing
- Production

Each level can have its own specific settings for:

- Database connections
- Logging
- Security parameters
- Rate limiting

## TypeScript Interfaces

### IUser Interface

```typescript
interface IUser {
  username?: string;
  email?: string;
  password?: string;
  // Additional user properties
}
```

## Development

To contribute to development:

1. Fork the repository
2. Create a feature branch `feat/<your_feature_name>`
3. Make changes
4. Run tests (when implemented)
5. Submit a pull request

## Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Build and run the production server
- `npm run dev`: Run development server with hot reload
- `npm test`: Run tests (to be implemented)
