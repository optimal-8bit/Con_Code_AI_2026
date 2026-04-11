import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlassButton({ className, children, ...props }) {
  return (
    <Button
      className={cn(
        "glass-button border border-primary/30 bg-primary/20 text-white hover:bg-primary/30",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
