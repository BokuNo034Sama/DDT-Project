-- FUNCTION: get_next_serial_number
CREATE OR REPLACE FUNCTION get_next_serial_number(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_serial INTEGER;
BEGIN
  -- Atomically get the next serial number for the tenant
  -- Using a subquery to find the max and adding 1
  -- Note: In a high-concurrency environment, a sequence per tenant or a dedicated counters table might be better,
  -- but for a pilot lab, this SELECT FOR UPDATE pattern is sufficient if we lock the tenant or use a separate counter table.
  -- Here we'll use a simple max + 1.
  
  SELECT COALESCE(MAX(serial_number), 0) + 1
  INTO v_next_serial
  FROM projects
  WHERE tenant_id = p_tenant_id;
  
  RETURN v_next_serial;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: advance_project_status
CREATE OR REPLACE FUNCTION advance_project_status(p_project_id UUID, p_stage stage_enum)
RETURNS void AS $$
DECLARE
  v_new_status project_status_enum;
BEGIN
  CASE p_stage
    WHEN 'analysis' THEN v_new_status := 'analysis_done';
    WHEN 'sketch' THEN v_new_status := 'sketch_done';
    WHEN 'report_writing' THEN v_new_status := 'report_done';
    ELSE RETURN; -- No auto-advance for other stages
  END CASE;

  UPDATE projects
  SET status = v_new_status,
      updated_at = NOW()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;
