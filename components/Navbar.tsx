/**
 * RESPONSIBILITIES:
 * 1. Displays app branding/logo (links to home)
 * 2. Provides theme toggle (light/dark mode)
 * 3. Conditionally renders auth UI:
 *    - Guests: "Sign In" / "Sign Up" buttons
 *    - Auth users: UserNav dropdown (profile, logout)
 * 
 * AUTH FLOW:
 * Uses Kinde's server-side session helpers to check auth status
 * before rendering, ensuring no flash of incorrect UI.
 */

import Link from "next/link";
import { ThemeToggle } from "./Themetoggle";
import { Button } from "./ui/button";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs";
import { UserNav } from "./UserNav";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function Navbar() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="border-b bg-background h-[10vh] flex items-center">
      <div className="container flex items-center justify-between">
        <Link href="/">
          <h1 className="font-bold text-3xl">Kennedy Malonga</h1>
        </Link>

        <div className="flex items-center gap-x-5">
          <ThemeToggle />

          {(await isAuthenticated()) ? (
            <UserNav
              name={user?.given_name as string}
              email={user?.email as string}
              image={user?.picture as string}
            />
          ) : (
            <div className="flex items-center gap-x-5">
              <LoginLink>
                <Button>Sign In</Button>
              </LoginLink>
              <RegisterLink>
                <Button variant="secondary">Sign Up</Button>
              </RegisterLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
