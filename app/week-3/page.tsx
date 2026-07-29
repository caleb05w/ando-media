import type { Metadata } from "next";
import OnboardingFlow from "./OnboardingFlow";

export const metadata: Metadata = {
  title: "Name your first agent",
};

export default function Week3Page() {
  return <OnboardingFlow />;
}
