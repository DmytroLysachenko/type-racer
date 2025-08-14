"use client";

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="text-sm ">
      <p>Every round is 20 seconds</p>
      <p>
        Next round in <span suppressHydrationWarning>{secondsLeft}s</span>
      </p>
    </div>
  );
}
