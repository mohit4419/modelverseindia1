-- Trigger definition to execute handle_migration_csharp_trigger on profile updates/creations
DROP TRIGGER IF EXISTS on_profile_migration_csharp ON public.profiles;

CREATE TRIGGER on_profile_migration_csharp
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_migration_csharp_trigger();
