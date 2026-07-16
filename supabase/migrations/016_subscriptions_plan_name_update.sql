-- Migration to ensure subscriptions table columns and existing plan_name mappings
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50) DEFAULT 'starter';

-- Update existing active subscriptions based on cost in kobo
UPDATE subscriptions
SET plan_name = CASE
  WHEN amount_kobo = 4500000 THEN 'pro'
  ELSE 'starter'
END
WHERE status = 'active';
