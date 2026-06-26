-- Add report_bot_draft status to project_status_enum
ALTER TYPE project_status_enum ADD VALUE 'report_bot_draft' AFTER 'report_done';
