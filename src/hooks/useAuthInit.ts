import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuthInit() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
}
