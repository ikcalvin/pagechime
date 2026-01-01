-- Add organization columns to articles table
alter table articles 
add column if not exists is_archived boolean default false,
add column if not exists is_deleted boolean default false;

-- Create tags table
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null, -- references users(id)
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Create article_tags junction table
create table if not exists article_tags (
  article_id uuid not null references articles(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Index for performance
create index if not exists idx_tags_user_id on tags(user_id);
create index if not exists idx_article_tags_article_id on article_tags(article_id);
create index if not exists idx_article_tags_tag_id on article_tags(tag_id);

-- Disable RLS for now as per project convention
alter table tags disable row level security;
alter table article_tags disable row level security;
