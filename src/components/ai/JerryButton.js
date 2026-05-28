import { useState } from "react";
import Button from "@/components/ui/Button";
import JerryPanel, { isJerryUnavailable } from "./JerryPanel";

// Opens the Jerry panel. The button hides once the server has answered 503 in this app session.
export default function JerryButton({
  mode,
  projectId,
  label = "Ask Jerry",
  onApply,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);

  if (isJerryUnavailable()) return null;

  return (
    <>
      <Button variant="soft" size="sm" icon="sparkle" className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <JerryPanel
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        projectId={projectId}
        onApply={onApply}
      />
    </>
  );
}
