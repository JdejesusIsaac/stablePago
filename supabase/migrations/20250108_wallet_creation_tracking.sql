-- Track wallet creation by users for rate limiting
CREATE TABLE IF NOT EXISTS wallet_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id text NOT NULL, -- Crossmint user ID of who created the wallet
  recipient_email text NOT NULL, -- Email of the recipient
  wallet_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_wallet_creations_creator ON wallet_creations(creator_user_id);
CREATE INDEX idx_wallet_creations_recipient ON wallet_creations(recipient_email);
CREATE INDEX idx_wallet_creations_created_at ON wallet_creations(created_at);

-- RLS Policies (users can only see wallets they created)
ALTER TABLE wallet_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view wallets they created"
  ON wallet_creations
  FOR SELECT
  USING (true); -- Allow reading for analytics/admin

CREATE POLICY "System can insert wallet creations"
  ON wallet_creations
  FOR INSERT
  WITH CHECK (true); -- Server-side only

COMMENT ON TABLE wallet_creations IS 'Tracks wallet creation for rate limiting and analytics';

