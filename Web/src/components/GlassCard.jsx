import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function GlassCard({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}) {
  return (
    <Card className={cn("glass-card border-white/15", className)}>
      {(title || description || action) && (
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-1">
            {title ? <CardTitle className="text-xl tracking-tight">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
