// DEPRECATED: Legacy component from an earlier iteration of the feed UI.
// Not used in the current NOP Intelligence Layer core flows (PHASE 2).
import { useState } from "react";

type SmartButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onClick: () => Promise<unknown> | unknown;
  children: React.ReactNode;
};

export default function SmartButton({ onClick, children, ...props }: SmartButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={loading || props.disabled}
      onClick={async (event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        setLoading(true);
        try {
          await onClick();
        } catch (error) {
          console.error("Action error:", error);
          alert((error as { message?: string } | null)?.message || "Action failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
