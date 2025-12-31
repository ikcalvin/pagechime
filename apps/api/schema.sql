-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (if not managed by Auth, but typically Auth handles this. We will create a public profile table or similar if needed. Specs say 'managed manually or synced')
create table if not exists users (
  id uuid primary key references auth.users(id),
  email text unique not null,
  created_at timestamptz default now()
);

-- Articles table
create type article_status as enum ('queued', 'processing', 'completed', 'failed');

create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null, -- references users(id) if strict, or just uuid if loose
  original_url text not null,
  title text,
  clean_text text,
  image_url text,
  audio_url text,
  status article_status default 'queued',
  created_at timestamptz default now()
);

-- Index for performance
create index idx_articles_user_id on articles(user_id);
create index idx_articles_created_at on articles(created_at desc);

-- Disable RLS (per specs, though it's on by default in Supabase)
alter table articles disable row level security;
