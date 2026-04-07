/** Skeleton for `loading.tsx` under customer/vendor/admin — layout chrome stays mounted on navigation. */
export function DashboardSegmentLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-pulse" aria-hidden>
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-full max-w-md rounded-md bg-muted" />
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
      </div>
      <div className="mt-2 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
