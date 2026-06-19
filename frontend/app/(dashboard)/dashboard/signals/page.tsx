import type { Metadata } from "next";
import { SignalsPageContent } from "@/components/signals/signals-page-content";

export const metadata: Metadata = {
  title: "Signals - SignalForge",
};

export default function SignalsPage() {
  return <SignalsPageContent />;
}
