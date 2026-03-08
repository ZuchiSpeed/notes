/**
 * RESPONSIBILITIES:
 * 1. Protects route: Redirects unauthenticated users to home
 * 2. Syncs Kinde auth user with database:
 *    - Checks if user exists by EMAIL (stable identifier)
 *    - Creates new user record if not found
 *    - (Optional) Updates user ID if it changed since last login
 * 3. Renders dashboard shell with navigation sidebar
 */

import { DashboardNav } from "@/components/DashboardNav";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import prisma from "../lib/db";
import { stripe } from "../lib/stripe";

// Props for the getData function - user data from Kinde
type Props = {
  email: string;
  id: string;
  firstName: string | undefined | null;
  lastName: string | undefined | null;
  profileImage: string | undefined | null;
};

/**
 * Syncs authenticated user with database
 * @param Props - User data from Kinde session
 */
async function getData({
  email,
  id,
  firstName,
  lastName,
  profileImage,
}: Props) {
  // Look up user by EMAIL (not ID) to avoid duplicate creation
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  });

  // If user doesn't exist in DB, create their record
  if (!user) {
    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    // Create user with all required fields
    await prisma.user.create({
      data: {
        id: id,
        email: email,
        name: name || undefined,
      },
      select: { id: true, stripeCustomerId: true },
    });
  }

  // If user exists but ID changed, update it
  else if (user.id !== id) {
    await prisma.user.update({
      where: { email },
      data: { id },
    });
    user.id = id; // Update local reference
  }

  if (!user?.stripeCustomerId) {
    const data = await stripe.customers.create({
      email: email,
      metadata: {
        userId: id,
      },
    });

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        stripeCustomerId: data.id,
      },
    });
  }
}

/**
 * DashboardLayout: Server Component wrapper for all dashboard pages
 * - Handles auth check
 * - Syncs user data
 * - Renders responsive layout with sidebar navigation
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Redirect to home if not authenticated or missing email
  if (!user || !user.email) {
    return redirect("/");
  }

  // Sync user with database (create/update as needed)
  await getData({
    email: user.email,
    firstName: user.given_name,
    lastName: user.family_name,
    id: user.id,
    profileImage: user.picture,
  });

  // Render dashboard UI with responsive grid layout
  return (
    <div className="flex flex-col spac-y-6 mt-10">
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
