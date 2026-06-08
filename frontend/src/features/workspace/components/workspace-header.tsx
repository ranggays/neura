import type { ThemeMode, WorkspaceData } from "../types";
import { IconButton, WorkspaceIcon } from "./workspace-icons";

type WorkspaceHeaderProps = {
  workspace: WorkspaceData;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

export function WorkspaceHeader({ workspace, theme, onToggleTheme }: WorkspaceHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm dark:bg-sky-700">
          <WorkspaceIcon name="toys_fan" className="text-[22px]" />
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold leading-5">Evidence Graph</p>
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Workspace
          </p>
        </div>
        <nav className="ml-2 hidden min-w-0 items-center gap-2 text-sm md:flex">
          <span className="font-medium text-slate-500 dark:text-slate-400">Workspace</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{workspace.name}</span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <IconButton
          label="Toggle theme"
          icon={theme === "dark" ? "light_mode" : "dark_mode"}
          onClick={onToggleTheme}
        />
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-left transition hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900 dark:hover:bg-slate-800"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white dark:bg-sky-700">
            RY
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
              {workspace.user.name}
            </span>
            <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{workspace.user.email}</span>
          </span>
          <WorkspaceIcon name="expand_more" className="text-[18px] text-slate-400" />
        </button>
      </div>
    </header>
  );
}
