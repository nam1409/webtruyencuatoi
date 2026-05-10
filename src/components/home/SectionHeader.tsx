import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 mb-10 sm:mb-14",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-3">
          <div className="h-px w-8 bg-primary/60" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 w-full">
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            {title}
          </h2>

          {description && (
            <p className="max-w-2xl text-muted-foreground/80 leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
