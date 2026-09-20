import type { Metadata } from "next";
import { AddClient } from "@/components/add-client";

export const metadata: Metadata = { title: "Add your Bulwark" };

export default function AddPage() {
  return <AddClient />;
}
