# Authentication System Documentation

## Overview
A complete authentication system for the React Smart Study Assistant with login, signup, protected routes, and logout functionality.

## Created Files

### 1. **Login Page** (`src/pages/Login.tsx`)
Complete login form with:
- Email and password fields
- Form validation (email format check)
- Error handling and display
- Loading state with spinner animation
- API call to `POST http://localhost:5000/auth/login`
- LocalStorage userId storage
- Auto-redirect to `/chat` on success
- Link to signup page

### 2. **Signup Page** (`src/pages/Signup.tsx`)
Complete signup form with:
- Name, email, and password fields
- Full validation:
  - Required fields check
  - Email format validation
  - Password minimum length (6 characters)
- Error messages and visual feedback
- Loading state with spinner
- API call to `POST http://localhost:5000/auth/signup`
- LocalStorage userId storage (`response.user._id`)
- Auto-redirect to `/chat` on success
- Link to login page

### 3. **Protected Route Component** (`src/components/ProtectedRoute.tsx`)
Route guard that:
- Checks for `userId` in localStorage
- Redirects unauthenticated users to `/login`
- Wraps protected routes to prevent unauthorized access

### 4. **Logout Button** (`src/components/LogoutButton.tsx`)
Simple logout component that:
- Clears userId from localStorage
- Redirects to `/login`
- Styled with red button color

### 5. **Updated App.tsx**
Now includes:
- React Router setup with BrowserRouter
- Route definitions:
  - `/login` - Public login page
  - `/signup` - Public signup page
  - `/chat` - Protected chat interface
  - `/` - Redirects to `/chat`
- ProtectedRoute wrapper for chat page
- Fallback route redirects to login

### 6. **Updated ChatWindow.tsx**
Added:
- LogoutButton import and integration
- Logout button in header for easy access

## Features

### UI/UX
- ✅ Clean, modern centered card layout
- ✅ Responsive gradient backgrounds (blue-indigo)
- ✅ Input fields with focus states (indigo ring on focus)
- ✅ Color-coded error states (red borders)
- ✅ Smooth transitions and hover effects
- ✅ Loading spinner animations
- ✅ Error message display with styling

### Validation
- ✅ Real-time error clearing (on user input)
- ✅ Email format validation (regex check)
- ✅ Password minimum length validation (6 chars)
- ✅ Required field validation
- ✅ Form submission prevention with invalid data

### Security & State Management
- ✅ Protected routes prevent unauthorized access
- ✅ UserId storage in localStorage
- ✅ URL redirect on auth state change
- ✅ Session persistence
- ✅ Logout clears authentication

### API Integration
- ✅ Fetch API for all requests
- ✅ POST endpoints for login/signup
- ✅ JSON request/response handling
- ✅ Error handling and user feedback
- ✅ Network error handling

## Usage

### Start the Application
```bash
npm run dev
```

The app will:
1. Start at root (`/`)
2. Redirect to `/chat` (which redirects to `/login` if not authenticated)
3. Users can signup or login
4. After auth, access `/chat` with chat interface
5. Logout button clears session and returns to login

### Router Structure
```
/ → /chat → /login (if not authenticated)
/login → form submission → /chat (with userId)
/signup → form submission → /chat (with userId)
/chat → ProtectedRoute wraps ChatWindow
```

## API Endpoints Expected

### Signup
```
POST http://localhost:3000/auth/signup
Body: { name, email, password }
Response: { user: { _id: "..." }, ... }
```

### Login
```
POST http://localhost:3000/auth/login
Body: { email, password }
Response: { user: { _id: "..." }, ... }
```

## Styling
- Tailwind CSS utility classes
- Indigo color scheme for primary actions
- Red for logout/critical actions
- Slate for neutrals
- Emerald for status indicators
- Smooth animations and transitions

## Browser Compatibility
- Modern browsers with ES6+ support
- LocalStorage support required
- Fetch API support required

## Dependencies
- React 19.0.0
- React Router DOM 6.x
- Tailwind CSS 4.2.1
