-- Database functions for schema management
-- These functions should be created in your Supabase database

-- Function to create organization schema
CREATE OR REPLACE FUNCTION create_organization_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop organization schema
CREATE OR REPLACE FUNCTION drop_organization_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute arbitrary SQL (for table creation)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if schema exists
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tables exist
CREATE OR REPLACE FUNCTION check_tables_exist(schema_name TEXT, table_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  table_name TEXT;
  table_count INTEGER := 0;
  expected_count INTEGER := array_length(table_names, 1);
BEGIN
  FOREACH table_name IN ARRAY table_names
  LOOP
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = schema_name 
      AND table_name = table_name
    ) THEN
      table_count := table_count + 1;
    END IF;
  END LOOP;
  
  RETURN table_count = expected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;