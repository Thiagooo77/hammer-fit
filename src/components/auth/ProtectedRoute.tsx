import React from "react";
import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Loader2 className="size-12 text-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[PERMISSION_DENIED] Unauthenticated access attempt');
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
