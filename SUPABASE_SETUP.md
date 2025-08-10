# Supabase Authentication Setup

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 3. Configure Environment Variables

Create a `.env` file in your project root with:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Configure Authentication Settings

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add any additional redirect URLs you need
4. Configure email templates if desired

## 5. Test the Authentication

1. Start your development server: `npm run dev`
2. Click the "Login" button in the navbar
3. Try creating an account and signing in
4. Check your email for confirmation (if email confirmation is enabled)

## 6. Customize Authentication

You can modify the authentication components in:
- `src/components/Login.jsx` - Login form
- `src/components/SignUp.jsx` - Signup form
- `src/contexts/AuthContext.jsx` - Authentication logic
- `src/App.jsx` - Main app integration

## 7. Additional Features

The current implementation includes:
- Email/password authentication
- User session management
- Protected routes (can be extended)
- Responsive UI components
- Error handling and loading states

## 8. Security Notes

- Never commit your `.env` file to version control
- The anon key is safe to use in the browser
- Consider implementing additional security measures for production
- Use Row Level Security (RLS) in Supabase for database protection
