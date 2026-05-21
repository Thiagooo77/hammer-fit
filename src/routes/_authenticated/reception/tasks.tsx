import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowLeft, Plus, Filter, Search, Calendar, ShieldCheck, Clock, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/reception/tasks")({
  component: () => <Navigate to="/reception/dashboard" />, // This is a mistake, wait.
});
