type Workspace2IconProps = {
  name: string;
  className?: string;
};

export function Workspace2Icon({ name, className = "" }: Workspace2IconProps) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded inline-flex items-center justify-center ${className}`}>
      {name}
    </span>
  );
}

type Workspace2IconButtonProps = {
  label: string;
  icon: string;
  onClick?: () => void;
  className?: string;
};

export function Workspace2IconButton({ label, icon, onClick, className = "" }: Workspace2IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:bg-slate-800 ${className}`}
    >
      <Workspace2Icon name={icon} className="text-[19px]" />
    </button>
  );
}
