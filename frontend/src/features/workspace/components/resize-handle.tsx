type ResizeHandleProps = {
  onStart: () => void;
};

export function ResizeHandle({ onStart }: ResizeHandleProps) {
  return (
    <button
      type="button"
      aria-label="Resize panel"
      onPointerDown={onStart}
      className="group z-20 flex h-full w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-transparent transition hover:bg-sky-100/70 dark:hover:bg-sky-950/50"
    >
      <span className="h-8 w-0.5 rounded-full bg-slate-300 transition group-hover:bg-sky-700 dark:bg-slate-700 dark:group-hover:bg-sky-400" />
    </button>
  );
}
