
-- Create trigger for profiles and roles
DROP TRIGGER IF EXISTS on_auth_user_created_hammer ON auth.users;
CREATE TRIGGER on_auth_user_created_hammer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_hammer_user();
