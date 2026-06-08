type WorkspaceIconProps = {
  name: string;
  className?: string;
};

export function WorkspaceIcon({ name, className = "" }: WorkspaceIconProps) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded inline-flex items-center justify-center ${className}`}>
      {name}
    </span>
  );
}

type IconButtonProps = {
  label: string;
  icon: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
};

export function IconButton({ label, icon, onClick, className = "", type = "button" }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-900 dark:hover:bg-slate-800 dark:hover:text-sky-300 ${className}`}
    >
      <WorkspaceIcon name={icon} className="text-[19px]" />
    </button>
  );
}
