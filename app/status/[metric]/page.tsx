import { redirect } from "next/navigation";

export default async function MetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  const valid = ["gateway", "database", "memory"];
  if (!valid.includes(metric)) redirect("/status");
  redirect("/status/metrics");
}
