interface ErrorStateProps {
  readonly title?: string;
  readonly description?: string;
}

export function ErrorState({
  description = "Try again or contact support if the problem continues.",
  title = "Something went wrong"
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
