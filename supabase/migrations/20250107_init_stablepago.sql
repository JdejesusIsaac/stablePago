-- StablePago Database Schema
-- This migration creates all tables needed for Circle integration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (links to Crossmint users)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  crossmint_user_id text not null unique,
  email text,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- RLS Policies for users
create policy "Users can view own data"
  on public.users for select
  using (auth.uid()::text = crossmint_user_id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid()::text = crossmint_user_id);

-- Bank Beneficiaries (linked bank accounts for withdrawals)
create table if not exists public.bank_beneficiaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  circle_destination_id text not null unique,
  legal_name text not null,
  bank_name text not null,
  country text not null default 'PR',
  account_last_four text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.bank_beneficiaries enable row level security;

-- RLS Policies for bank_beneficiaries
create policy "Users can view own bank accounts"
  on public.bank_beneficiaries for select
  using (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

create policy "Users can insert own bank accounts"
  on public.bank_beneficiaries for insert
  with check (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

-- Platform Fees configuration
create table if not exists public.platform_fees (
  id uuid primary key default uuid_generate_v4(),
  tx_type text not null,
  fee_bps integer not null, -- basis points (1.25% = 125 bps)
  min_fee_usd numeric(10,2) default 1.00,
  max_fee_usd numeric(10,2),
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_at timestamptz not null default now()
);

-- Insert default fee structure
insert into public.platform_fees (tx_type, fee_bps, min_fee_usd, max_fee_usd)
values ('withdraw', 125, 1.00, null); -- 1.25% fee, minimum $1

-- Fiat Payouts (withdrawal transactions)
create table if not exists public.fiat_payouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  beneficiary_id uuid references public.bank_beneficiaries(id) on delete set null,
  wallet_id text not null,
  amount_usd numeric(12,2) not null,
  fee_usd numeric(12,2) not null,
  net_amount_usd numeric(12,2) not null,
  provider text not null default 'circle',
  circle_payout_id text unique,
  status text not null default 'pending',
  error_code text,
  error_message text,
  idempotency_key text unique not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.fiat_payouts enable row level security;

-- RLS Policies for fiat_payouts
create policy "Users can view own payouts"
  on public.fiat_payouts for select
  using (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

create policy "Users can insert own payouts"
  on public.fiat_payouts for insert
  with check (user_id in (select id from public.users where crossmint_user_id = auth.uid()::text));

-- Indexes for performance
create index idx_fiat_payouts_user_id on public.fiat_payouts(user_id);
create index idx_fiat_payouts_status on public.fiat_payouts(status);
create index idx_fiat_payouts_circle_payout_id on public.fiat_payouts(circle_payout_id);
create index idx_bank_beneficiaries_user_id on public.bank_beneficiaries(user_id);
create index idx_users_crossmint_user_id on public.users(crossmint_user_id);

-- Webhook Events (for Circle webhook processing)
create table if not exists public.webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  event_type text not null,
  event_id text unique,
  payload jsonb not null,
  signature text,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now()
);

-- Index for webhook events
create index idx_webhook_events_provider on public.webhook_events(provider);
create index idx_webhook_events_processed on public.webhook_events(processed);
create index idx_webhook_events_event_id on public.webhook_events(event_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function update_updated_at_column();

create trigger update_bank_beneficiaries_updated_at
  before update on public.bank_beneficiaries
  for each row
  execute function update_updated_at_column();

create trigger update_fiat_payouts_updated_at
  before update on public.fiat_payouts
  for each row
  execute function update_updated_at_column();

-- Comments for documentation
comment on table public.users is 'StablePago users linked to Crossmint wallets';
comment on table public.bank_beneficiaries is 'User bank accounts for Circle withdrawals';
comment on table public.platform_fees is 'Platform fee configuration';
comment on table public.fiat_payouts is 'Withdrawal transactions via Circle';
comment on table public.webhook_events is 'Circle webhook events log';

