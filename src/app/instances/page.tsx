import type { Metadata } from "next";
import { InstancesClient } from "@/components/instances-client";

export const metadata: Metadata = { title: "Your servers" };

export default function InstancesPage() {
  return <InstancesClient />;
}
