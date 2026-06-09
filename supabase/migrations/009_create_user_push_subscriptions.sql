-- Create user push subscriptions table
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL UNIQUE,
  auth_key        TEXT NOT NULL,
  p256dh_key      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user ON public.user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_tenant ON public.user_push_subscriptions(tenant_id);
