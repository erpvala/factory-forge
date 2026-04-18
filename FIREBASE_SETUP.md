# Firebase Auth Setup Instructions

## 🎯 YOUR MANUAL TASKS

### ✅ 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `factory-forge`
4. Enable Google Analytics (optional)
5. Click "Create project"

### ✅ 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Enable "Google" sign-in method
5. Save configuration

### ✅ 3. Get Configuration Keys
1. Go to Project Settings (⚙️ icon)
2. Under "Your apps", click "Web app"
3. Copy the `firebaseConfig` object
4. **Replace the placeholder in `src/lib/firebase.ts`**

## 📦 What I've Implemented

### ✅ Backend Logic (No UI Changes)
- Firebase SDK integration
- Authentication functions (signup, login, logout, Google login)
- Auth context and hooks
- Route protection middleware
- API routes for auth operations

### ✅ Files Created
```
src/lib/firebase.ts              # Firebase configuration and auth functions
src/hooks/useFirebaseAuth.ts     # React auth hook
src/components/Auth/AuthGuard.tsx # Route protection component
src/middleware-firebase.ts       # Firebase middleware
src/app/api/auth/firebase/       # API routes for auth operations
├── login/route.ts
├── signup/route.ts
├── google/route.ts
├── logout/route.ts
└── me/route.ts
```

### ✅ Functions Available
```typescript
// Auth functions
signUp(email, password)
login(email, password)
loginWithGoogle()
logout()
getCurrentUser()
onAuthStateChanged(callback)
```

### ✅ API Endpoints
```
POST /api/auth/firebase/login
POST /api/auth/firebase/signup
POST /api/auth/firebase/google
POST /api/auth/firebase/logout
GET  /api/auth/firebase/me
```

## 🔧 How to Use

### 1. Update Firebase Config
Replace the placeholder in `src/lib/firebase.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Install Dependencies
```bash
npm install firebase
```

### 3. Wrap App with Auth Provider
In your layout or root component:

```typescript
import { FirebaseAuthProvider } from '@/hooks/useFirebaseAuth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
```

### 4. Protect Routes
Wrap protected routes with AuthGuard:

```typescript
import { AuthGuard } from '@/components/Auth/AuthGuard';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
```

### 5. Use Auth in Components
```typescript
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export default function LoginComponent() {
  const { login, signUp, logout, user, isLoading } = useFirebaseAuth();

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // User logged in
    }
  };
}
```

## 🚀 Ready to Use

Once you provide the Firebase config keys, the system will be ready to use with:
- ✅ Email/Password authentication
- ✅ Google sign-in
- ✅ Route protection
- ✅ Session management
- ✅ API endpoints
- ✅ No UI changes (as requested)
