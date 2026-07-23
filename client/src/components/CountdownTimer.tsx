import { useEffect, useState } from "react";

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="badge" style={{ fontSize: "1.2em", fontWeight: 700, color: remaining <= 5 ? "var(--danger)" : "var(--gold-bright)" }}>
      ⏱ {remaining}s
    </div>
  );
}
