ALTER TABLE "vendor_profiles" ADD COLUMN "public_slug" text;--> statement-breakpoint
UPDATE "vendor_profiles" SET "public_slug" =
  left(
    trim(both '-' from regexp_replace(
      lower(regexp_replace(coalesce("business_name", ''), '[^a-zA-Z0-9]+', '-', 'g')),
      '-+', '-', 'g'
    )),
    50
  ) || '-' || substring(replace(cast("id" as text), '-', ''), 1, 12)
WHERE "public_slug" IS NULL;--> statement-breakpoint
UPDATE "vendor_profiles" SET "public_slug" = 'vendor-' || replace(cast("id" as text), '-', '')
WHERE "public_slug" IS NULL OR trim("public_slug") = '' OR trim("public_slug") = '-';--> statement-breakpoint
ALTER TABLE "vendor_profiles" ALTER COLUMN "public_slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_public_slug_unique" UNIQUE("public_slug");
