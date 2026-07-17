CREATE TYPE lsmtl_status_enum AS ENUM (
  'pending',
  'report_rejected',
  'mismatched_report',
  'report_collected'
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS lsmtl_status
  lsmtl_status_enum DEFAULT 'pending';
