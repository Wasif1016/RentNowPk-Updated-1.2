/** Skeleton for `loading.tsx` under customer/vendor/admin — layout chrome stays mounted on navigation. */
export function DashboardSegmentLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6 animate-pulse" aria-hidden>
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-full max-w-md rounded-md bg-muted" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
