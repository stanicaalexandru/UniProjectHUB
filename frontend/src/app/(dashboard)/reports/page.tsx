"use client";
import { RequireRole } from "@/hooks/useRole";
import ReportsContent from "./ReportsContent";
export default function ReportsPage() {
  return <RequireRole roles={["admin","professor"]}><ReportsContent /></RequireRole>;
}
