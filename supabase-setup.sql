-- Haybarn Beer Co. tasting feedback table
-- Run this in the Supabase SQL Editor after creating a project.
-- Then enable/verify RLS and test submissions before public launch.
create table if not exists public.tasting_feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  beer text not null,
  rating integer not null check (rating between 1 and 5),
  comments text,
  would_order text,
  public_ok boolean not null default false,
  first_name text,
  email text,
  constraint comments_length check (comments is null or char_length(comments) <= 1200),
  constraint name_length check (first_name is null or char_length(first_name) <= 60),
  constraint email_length check (email is null or char_length(email) <= 160)
);

alter table public.tasting_feedback enable row level security;

-- Allows website visitors to submit feedback but not read the table.
-- Do not add a public SELECT policy for private feedback.
drop policy if exists "Anyone can submit tasting feedback" on public.tasting_feedback;
create policy "Anyone can submit tasting feedback"
on public.tasting_feedback for insert
to anon
with check (
  rating between 1 and 5
  and char_length(beer) <= 120
  and (comments is null or char_length(comments) <= 1200)
);

-- Review the table only through the authenticated Supabase dashboard or a secured admin interface.
-- Do not expose email addresses or private comments through a public API.
