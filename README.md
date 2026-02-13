Smart Bookmark App

A simple real-time bookmark manager built with Next.js (App Router) and Supabase.

🚀 Features

Google Sign-In (OAuth only)

Add and delete bookmarks (Title + URL)

Private bookmarks per user

Real-time updates across tabs

Deployed on Vercel

🛠 Tech Stack

Next.js (App Router)

Supabase (Auth + Database + Realtime)

Tailwind CSS

Vercel

🧠 Challenges Faced & Solutions

1. Google OAuth Setup
   

Initially, login redirects were not working correctly.

I fixed this by properly configuring redirect URLs in Supabase, Google Cloud Console, and Vercel environment variables.

2. Row-Level Security (RLS)

At first, users could see all bookmarks.

I enabled RLS and added policies using:

auth.uid() = user_id

This ensured bookmarks are private per authenticated user.

3. Real-time Updates

Bookmarks were not syncing across tabs.
I implemented Supabase realtime subscriptions using channel() and handled cleanup properly to avoid duplicate listeners.

⚙️ Setup
git clone https://github.com/Jaya1718/smart-bookmark-app.git

cd smart-bookmark-app

npm install

npm run dev

Create a .env.local file:

NEXT_PUBLIC_SUPABASE_URL=your_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
