import Link from "next/link";
import { ThemeToggle } from "./Themetoggle";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <nav className="border-b bg-background h-[10vh] flex items-center">
      <div className="container flex items-center justify-between">
        <Link href="/">
          <h1 className="font-bold text-3xl">Kennedy Malonga</h1>
        </Link>

        <div className="flex items-center gap-x-5">
          <ThemeToggle />

          <div className="flex items-center gap-x-5">
            <Button>Sign In</Button>
            <Button variant="secondary">Sign Up</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
