-- Database Function Trigger to notify external C# listeners (e.g. ASP.NET or .NET Core serverless functions) on schema changes/migrations
CREATE OR REPLACE FUNCTION public.handle_migration_csharp_trigger()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  -- Construct the JSON notification payload detailing the migration event
  payload := json_build_object(
    'event_type', 'DB_MIGRATION_COMPLETED',
    'triggered_at', timezone('utc'::text, now())::text,
    'table_affected', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', NEW.id
  )::text;

  -- Dispatch PostgreSQL pg_notify to alert any listening C# clients (like a SqlTableDependency or Npgsql connection)
  PERFORM pg_notify('migration_csharp_channel', payload);
  
  -- Log the dispatch action
  RAISE NOTICE 'Migration event dispatched on channel "migration_csharp_channel" with payload: %', payload;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
