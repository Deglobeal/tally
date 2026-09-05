import { Link, createFileRoute } from "@tanstack/react-router";
import { authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none">
            <path
              d="M3.5 8.2 6.2 11l6.3-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="font-display text-4xl font-medium tracking-tight italic">
          Tally
        </h1>
      </div>

      <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
        Sign in to keep tasks, totals, and reminders in sync across your phone
        and laptop. You can also keep everything on this device only.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {authEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center rounded-xl"
            onClick={() =>
              void signIn({
                callbackURL: "/",
                errorCallbackURL: "/login",
              })
            }
          >
            Continue with Google
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sign-in is disabled.
          </p>
        )}
      </div>

      <Button asChild variant="ghost" className="mt-4">
        <Link to="/">Continue on this device</Link>
      </Button>
    </main>
  );
}
