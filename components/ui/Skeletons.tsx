"use client";

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export function RowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 bg-white/[0.03] flex items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function RoleRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function ScheduleRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 bg-white/[0.03] flex items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function TagRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 bg-white/[0.03] flex items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function PollRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function GiveawayRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export function SettingRowSkeleton({ controlWidth = 'w-24' }: { controlWidth?: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className={`h-8 ${controlWidth} flex-shrink-0`} />
    </div>
  );
}

export function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}