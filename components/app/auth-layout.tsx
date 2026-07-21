import { LayoutGrid, Users, CalendarDays } from "lucide-react";

const FEATURES = [
  { label: "Coordinate your club's events", icon: CalendarDays },
  { label: "Manage members and roles", icon: Users },
  { label: "Track budget and funding", icon: LayoutGrid },
] as const;

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-page">
      <div className="hidden w-full max-w-md flex-col justify-center gap-8 border-r border-surface-border px-12 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-dim text-brand font-semibold">
            C
          </div>
          <span className="text-sm font-semibold text-copy-primary">
            Club Hub
          </span>
        </div>

        <div>
          <p className="text-sm text-copy-secondary">
            The workspace for running your student club.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {FEATURES.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 text-sm text-copy-muted"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
