import { cn } from "@/lib/ui/cn";

/**
 * The letter grade, coloured by band.
 *
 * The bands mirror `GRADE_BANDS` in the backend's grading.py. Only the first
 * character is switched on, so a new band like "B++" would still land in the
 * right colour rather than falling through to grey.
 */
function toneFor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "border-success/30 bg-success/10 text-success";
  if (letter === "B") return "border-low/30 bg-low/10 text-low";
  if (letter === "C") return "border-medium/30 bg-medium/10 text-medium";
  if (letter === "D") return "border-high/30 bg-high/10 text-high";
  return "border-critical/30 bg-critical/10 text-critical";
}

export function GradeBadge({
  grade,
  score,
  size = "md",
  className,
}: {
  grade: string | null;
  score?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!grade) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-dashed border-border",
          "font-semibold text-muted",
          size === "lg" ? "size-16 text-2xl" : size === "md" ? "size-11 text-base" : "size-8 text-xs",
          className,
        )}
        // The dash is decorative; the label is what carries the meaning.
        aria-label="Not graded yet"
      >
        –
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-lg border font-semibold tabular-nums",
        toneFor(grade),
        size === "lg" ? "size-16 text-2xl" : size === "md" ? "size-11 text-base" : "size-8 text-xs",
        className,
      )}
      aria-label={score === null || score === undefined ? `Grade ${grade}` : `Grade ${grade}, score ${score} of 100`}
    >
      <span aria-hidden="true">{grade}</span>
      {size === "lg" && score !== null && score !== undefined ? (
        <span aria-hidden="true" className="text-[0.625rem] font-medium opacity-75">
          {score}
        </span>
      ) : null}
    </span>
  );
}
