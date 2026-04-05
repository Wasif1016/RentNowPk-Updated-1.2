export default function VehiclePageLoading() {
  return (
    <div className="container mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
