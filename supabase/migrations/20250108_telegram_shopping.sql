-- StablePago Delegation Management
-- This migration adds tables for managing wallet delegations

-- Delegation records (for UI management)
create table if not exists public.delegations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bot_address text not null,
  daily_limit numeric(12,2) not null,
  weekly_limit numeric(12,2) not null,
  per_item_limit numeric(12,2) not null,
  approval_threshold numeric(12,2) not null,
  allowed_categories text[] not null,
  valid_until timestamptz not null,
  delegation_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_delegations_user_id on public.delegations(user_id);
create index if not exists idx_delegations_is_active on public.delegations(is_active);

-- Enable RLS
alter table public.delegations enable row level security;

-- RLS Policies for delegations
create policy "Users can view own delegations"
  on public.delegations for select
  using (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

create policy "Users can update own delegations"
  on public.delegations for update
  using (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

-- Function to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_delegations_updated_at
  before update on public.delegations
  for each row
  execute function update_updated_at_column();

-- Comments for documentation
comment on table public.delegations is 'Delegation records for bot signing authority';
