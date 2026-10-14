"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="site-shell error-page" role="alert">
      <p className="eyebrow">Something interrupted your session</p>
      <h1>We could not load the race.</h1>
      <p>
        Your saved results are still in this browser. Try loading the page
        again.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
