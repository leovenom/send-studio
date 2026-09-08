"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/page-header";

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

export const EventsChart = dynamic(
  () => import("./charts").then((m) => m.EventsChart),
  { loading: ChartSkeleton, ssr: false },
);

export const FunnelChart = dynamic(
  () => import("./charts").then((m) => m.FunnelChart),
  { loading: ChartSkeleton, ssr: false },
);

export const BotHumanChart = dynamic(
  () => import("./charts").then((m) => m.BotHumanChart),
  { loading: ChartSkeleton, ssr: false },
);
