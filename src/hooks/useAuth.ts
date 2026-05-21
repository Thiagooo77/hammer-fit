import { useAuthContext } from "@/context/AuthProvider";

export function useAuth() {
  const auth = useAuthContext();
  return auth;
}
