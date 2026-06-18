import { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard - SignalForge",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
