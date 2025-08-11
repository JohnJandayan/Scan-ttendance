-- Supabase Database Functions for Scan-ttendance
-- These functions should be executed in your Supabase SQL editor

-- Function to create organization-specific schema
CREATE OR REPLACE FUNCTION create_organization_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create the schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Create events table in the organization schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      creator_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ended_at TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT TRUE,
      metadata JSONB DEFAULT ''{}''::jsonb
    )', schema_name);
  
  -- Create members table in the organization schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT ''member'',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create audit logs table in the organization schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id UUID,
      user_id UUID,
      old_data JSONB,
      new_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create indexes for better performance
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_events_created_at ON %I.events(created_at)', 
    replace(schema_name, '.', '_'), schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_events_is_active ON %I.events(is_active)', 
    replace(schema_name, '.', '_'), schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_members_email ON %I.members(email)', 
    replace(schema_name, '.', '_'), schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_audit_logs_created_at ON %I.audit_logs(created_at)', 
    replace(schema_name, '.', '_'), schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create event-specific tables
CREATE OR REPLACE FUNCTION create_event_tables(schema_name TEXT, event_name TEXT)
RETURNS VOID AS $$
DECLARE
  attendance_table TEXT;
  verification_table TEXT;
BEGIN
  attendance_table := format('%s_attendance', event_name);
  verification_table := format('%s_verification', event_name);
  
  -- Create attendance table (expected attendees)
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.%I (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      participant_id TEXT NOT NULL UNIQUE,
      email TEXT,
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, attendance_table);
  
  -- Create verification table (actual check-ins)
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.%I (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT ''verified'',
      verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      verified_by UUID,
      metadata JSONB DEFAULT ''{}''::jsonb,
      FOREIGN KEY (participant_id) REFERENCES %I.%I(participant_id)
    )', schema_name, verification_table, schema_name, attendance_table);
  
  -- Create indexes for performance
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I_participant_id ON %I.%I(participant_id)', 
    replace(schema_name, '.', '_'), attendance_table, schema_name, attendance_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I_participant_id ON %I.%I(participant_id)', 
    replace(schema_name, '.', '_'), verification_table, schema_name, verification_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I_verified_at ON %I.%I(verified_at)', 
    replace(schema_name, '.', '_'), verification_table, schema_name, verification_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I_status ON %I.%I(status)', 
    replace(schema_name, '.', '_'), verification_table, schema_name, verification_table);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(schema_name TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_events INTEGER;
  active_events INTEGER;
  total_members INTEGER;
BEGIN
  -- Get total events
  EXECUTE format('SELECT COUNT(*) FROM %I.events', schema_name) INTO total_events;
  
  -- Get active events
  EXECUTE format('SELECT COUNT(*) FROM %I.events WHERE is_active = TRUE', schema_name) INTO active_events;
  
  -- Get total members
  EXECUTE format('SELECT COUNT(*) FROM %I.members', schema_name) INTO total_members;
  
  result := jsonb_build_object(
    'total_events', total_events,
    'active_events', active_events,
    'archived_events', total_events - active_events,
    'total_members', total_members,
    'updated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_stats(schema_name TEXT, event_name TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  attendance_table TEXT;
  verification_table TEXT;
  expected_attendees INTEGER;
  verified_attendees INTEGER;
  verification_rate NUMERIC;
BEGIN
  attendance_table := format('%s_attendance', event_name);
  verification_table := format('%s_verification', event_name);
  
  -- Get expected attendees count
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', schema_name, attendance_table) INTO expected_attendees;
  
  -- Get verified attendees count
  EXECUTE format('SELECT COUNT(DISTINCT participant_id) FROM %I.%I WHERE status = ''verified''', 
    schema_name, verification_table) INTO verified_attendees;
  
  -- Calculate verification rate
  IF expected_attendees > 0 THEN
    verification_rate := (verified_attendees::NUMERIC / expected_attendees::NUMERIC) * 100;
  ELSE
    verification_rate := 0;
  END IF;
  
  result := jsonb_build_object(
    'expected_attendees', expected_attendees,
    'verified_attendees', verified_attendees,
    'pending_attendees', expected_attendees - verified_attendees,
    'verification_rate', ROUND(verification_rate, 2),
    'updated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(schema_name TEXT, days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  EXECUTE format('
    DELETE FROM %I.audit_logs 
    WHERE created_at < NOW() - INTERVAL ''%s days''
  ', schema_name, days_to_keep);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive an event
CREATE OR REPLACE FUNCTION archive_event(schema_name TEXT, event_id UUID, archived_by UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the event to mark it as archived
  EXECUTE format('
    UPDATE %I.events 
    SET is_active = FALSE, 
        ended_at = NOW(),
        metadata = metadata || jsonb_build_object(''archived_by'', $1)
    WHERE id = $2
  ', schema_name) USING archived_by, event_id;
  
  -- Log the archival action
  EXECUTE format('
    INSERT INTO %I.audit_logs (action, table_name, record_id, user_id, new_data)
    VALUES (''archive'', ''events'', $1, $2, jsonb_build_object(''archived_at'', NOW()))
  ', schema_name) USING event_id, archived_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify attendance
CREATE OR REPLACE FUNCTION verify_attendance(
  schema_name TEXT, 
  event_name TEXT, 
  participant_id TEXT, 
  verified_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  attendance_table TEXT;
  verification_table TEXT;
  attendee_name TEXT;
  already_verified BOOLEAN;
BEGIN
  attendance_table := format('%s_attendance', event_name);
  verification_table := format('%s_verification', event_name);
  
  -- Check if participant exists in attendance table
  EXECUTE format('SELECT name FROM %I.%I WHERE participant_id = $1', schema_name, attendance_table) 
    INTO attendee_name USING participant_id;
  
  IF attendee_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Participant not found',
      'participant_id', participant_id
    );
  END IF;
  
  -- Check if already verified
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I WHERE participant_id = $1 AND status = ''verified'')', 
    schema_name, verification_table) INTO already_verified USING participant_id;
  
  IF already_verified THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already verified',
      'participant_id', participant_id,
      'name', attendee_name
    );
  END IF;
  
  -- Insert verification record
  EXECUTE format('
    INSERT INTO %I.%I (name, participant_id, status, verified_by)
    VALUES ($1, $2, ''verified'', $3)
  ', schema_name, verification_table) USING attendee_name, participant_id, verified_by;
  
  RETURN jsonb_build_object(
    'success', true,
    'participant_id', participant_id,
    'name', attendee_name,
    'verified_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
-- Note: These should be customized based on your specific security requirements

-- Enable RLS on the organizations table (public schema)
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policy for organizations (users can only see their own organization)
CREATE POLICY IF NOT EXISTS "Users can view their own organization" ON public.organizations
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS "Users can update their own organization" ON public.organizations
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_organization_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_tables(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_stats(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_event(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_attendance(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Create a function to initialize the database with required extensions
CREATE OR REPLACE FUNCTION initialize_database()
RETURNS VOID AS $$
BEGIN
  -- Create required extensions
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  
  -- Create the organizations table in public schema if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    schema_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_organizations_email ON public.organizations(email);
  CREATE INDEX IF NOT EXISTS idx_organizations_schema_name ON public.organizations(schema_name);
  
  -- Enable RLS
  ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the initialization
SELECT initialize_database();