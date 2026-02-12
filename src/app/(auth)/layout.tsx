import { TrendingUp } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4 sm:px-6">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        <TrendingUp className="size-8 text-primary" aria-hidden />
        <span className="text-xl font-bold tracking-tight sm:text-2xl">
          WealthArchitect
        </span>
      </div>
      <div className="w-full max-w-full sm:max-w-md">{children}</div>
    </div>
  );
}
