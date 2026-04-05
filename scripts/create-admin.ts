/**
 * Create a RentNowPk admin account (Supabase Auth + public.users via handle_new_user trigger),
 * or promote an existing user to ADMIN.
 *
 * Setup:
 *   - SUPABASE_SERVICE_ROLE_KEY — from Supabase Dashboard → Project Settings → API (secret; never expose to client)
 *   - NEXT_PUBLIC_SUPABASE_URL — same as the app
 *
 * Create (metadata triggers DB row with role ADMIN):
 *   pnpm exec tsx scripts/create-admin.ts <email> <password> "<full name>"
 *   # or via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME
 *
 * Promote existing user by email (needs DATABASE_URL):
 *   pnpm exec tsx scripts/create-admin.ts --promote <email>
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv[0] === "--promote" && argv[1]) {
    return { mode: "promote" as const, email: argv[1].trim().toLowerCase() };
  }

  let email: string | undefined;
  let password: string | undefined;
  let fullName: string | undefined;

  if (argv.length >= 3) {
    email = argv[0]?.trim().toLowerCase();
    password = argv[1];
    fullName = argv.slice(2).join(" ").trim();
  } else {
    email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    password = process.env.ADMIN_PASSWORD;
    fullName = process.env.ADMIN_FULL_NAME?.trim();
  }

  if (!email || !password || !fullName) {
    console.error(`Usage:
  Create:  tsx scripts/create-admin.ts <email> <password> "<full name>"
           or set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME
  Promote: tsx scripts/create-admin.ts --promote <email>`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  if (!fullName || fullName.length < 1) {
    console.error("Full name is required (at least 1 character).");
    process.exit(1);
  }

  return { mode: "create" as const, email, password, fullName };
}

async function promoteAdmin(email: string) {
  requireEnv("DATABASE_URL");
  const { db } = await import("../src/lib/db/index");
  const { users } = await import("../src/lib/db/schema");

  const updated = await db
    .update(users)
    .set({ role: "ADMIN", updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (updated.length === 0) {
    console.error(`No public.users row for email: ${email}`);
    process.exit(1);
  }

  console.log("Updated user to ADMIN:", updated[0]);
}

async function createAdmin(email: string, password: string, fullName: string) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "ADMIN",
      full_name: fullName,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already been registered") || msg.includes("already registered")) {
      console.error(
        "That email is already registered. To grant admin to the existing account, run:\n" +
          `  tsx scripts/create-admin.ts --promote ${email}`
      );
    } else {
      console.error("Supabase error:", error.message);
    }
    process.exit(1);
  }

  if (!data.user) {
    console.error("No user returned from createUser.");
    process.exit(1);
  }

  console.log("Admin user created:", {
    id: data.user.id,
    email: data.user.email,
  });
  console.log("You can sign in at /auth/login with this email and password.");
}

async function main() {
  const parsed = parseArgs();

  if (parsed.mode === "promote") {
    await promoteAdmin(parsed.email);
    return;
  }

  await createAdmin(parsed.email, parsed.password, parsed.fullName);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
