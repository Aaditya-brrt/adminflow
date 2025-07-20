# Authentication System

This document describes the authentication system implemented in AdminFlow using Next.js 15 best practices.

## Overview

The authentication system is built with the following components:

- **Server Actions**: Handle form submissions and validation
- **Client Components**: Manage UI state and user interactions
- **Context Provider**: Manage global authentication state
- **Middleware**: Handle route protection and redirects
- **Protected Routes**: Ensure authenticated access to dashboard

## Features

### ✅ Implemented
- Login form with email/password
- Signup form with name, email, and password
- Form validation using Zod
- Server-side validation and error handling
- Loading states and error messages
- Google OAuth placeholder (ready for Supabase integration)
- Protected routes with authentication checks
- Middleware for route protection
- Responsive design with Shadcn UI components

### 🔄 Ready for Integration
- Supabase authentication
- Google OAuth
- Session management
- User profile management

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── auth.ts              # Server actions for login/signup
│   └── auth/
│       ├── login/
│       │   └── page.tsx         # Login page
│       └── signup/
│           └── page.tsx         # Signup page
├── components/
│   └── auth/
│       ├── login-form.tsx       # Login form component
│       ├── signup-form.tsx      # Signup form component
│       ├── auth-loading.tsx     # Loading component
│       └── protected-route.tsx  # Route protection wrapper
├── contexts/
│   └── auth-context.tsx         # Authentication context
└── middleware.ts                # Route protection middleware
```

## Usage

### Login
Navigate to `/auth/login` to access the login form.

### Signup
Navigate to `/auth/signup` to create a new account.

### Protected Routes
The following routes are protected and require authentication:
- `/dashboard`
- `/workflows`
- `/chat`

### Authentication State
The authentication state is managed globally through the `AuthProvider` context.

## Integration with Supabase

To integrate with Supabase Auth:

1. **Install Supabase client**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Configure environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Update server actions** in `src/app/actions/auth.ts`:
   - Uncomment Supabase authentication code
   - Add session management
   - Implement proper error handling

4. **Update auth context** in `src/contexts/auth-context.tsx`:
   - Initialize Supabase client
   - Replace placeholder authentication with Supabase methods
   - Add session persistence

5. **Update middleware** in `src/middleware.ts`:
   - Add session verification
   - Implement proper authentication checks

## Form Validation

The forms use Zod for validation with the following rules:

### Login
- Email must be valid
- Password is required

### Signup
- Name must be at least 2 characters
- Email must be valid
- Password must be at least 8 characters
- Password must contain at least one letter and one number

## Error Handling

- Server-side validation errors are displayed inline
- General error messages are shown in alert components
- Loading states prevent multiple submissions
- Form fields are disabled during submission

## Security Features

- Server-side validation using Zod
- Form data is processed on the server
- No sensitive data in client-side code
- Protected routes with middleware
- Session-based authentication (ready for implementation)

## Next Steps

1. **Supabase Integration**: Replace placeholder authentication with Supabase
2. **Session Management**: Implement proper session handling
3. **User Profiles**: Add user profile management
4. **Password Reset**: Implement password reset functionality
5. **Email Verification**: Add email verification for signups
6. **Social Login**: Complete Google OAuth integration
7. **Role-based Access**: Add user roles and permissions

## Testing

The authentication system is ready for testing:

1. **Development**: Run `npm run dev`
2. **Production Build**: Run `npm run build`
3. **Access Routes**: Navigate to `/auth/login` or `/auth/signup`

## Notes

- Currently uses placeholder authentication for demonstration
- All Supabase integration points are marked with TODO comments
- Google OAuth shows placeholder messages
- Middleware is configured but authentication check is disabled for development 