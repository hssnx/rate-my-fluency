# Fluency Rater

This is a very simple full-stack application that allows users to rate admin's fluency, built with a React/Vite frontend and a Supabase backend.

## Features

- User Authentication (Sign up, Sign in) with Supabase Auth.
- Users can submit fluency ratings across three dimensions: naturalness, confidence, and eye contact.
- Users can view their past ratings.
- Admin dashboard to view analytics and all user ratings.

## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [TanStack Query](https://tanstack.com/query/latest)
- **Backend:**
  - [Supabase](https://supabase.io/) (Database, Auth, Storage)

## Supabase Setup

1.  **Database Schema:** see `schema.sql`.

## Usage

Navigate to the local URL provided by Vite. You can sign up, sign in, and start submitting ratings. To grant someone admin access, the developer must manually set the `is_admin` flag to `true` for that user in the `profiles` table.

Additionally, the application is hosted on Vercel via GitHub, so a git push automatically deploys the changes.
