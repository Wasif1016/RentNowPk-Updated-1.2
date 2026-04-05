import { AddVehicleForm } from '@/components/vendor/add-vehicle-form'

export default function VendorAddVehiclePage() {
  const logoDevPublishableKey =
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Add vehicle</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set pickup on the map, add photos and pricing. Listing city is taken from the pickup
          location automatically.
        </p>
      </div>
      <AddVehicleForm logoDevPublishableKey={logoDevPublishableKey} />
    </div>
  )
}
