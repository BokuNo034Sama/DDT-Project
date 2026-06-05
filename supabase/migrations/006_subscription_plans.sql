-- Migration to add plan_name column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50) 
DEFAULT 'starter';
