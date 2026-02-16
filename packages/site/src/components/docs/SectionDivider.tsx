interface SectionDividerProps {
  title?: string;
}

function SectionDivider({ title }: SectionDividerProps) {
  if (!title) {
    return (
      <hr className="my-8 border-t border-primary/10 dark:border-white/10" />
    );
  }

  return (
    <div className="my-8 flex items-center gap-4">
      <div className="flex-1 h-px bg-primary/10 dark:bg-white/10" />
      <span className="text-xs uppercase tracking-widest text-text-secondary dark:text-text-dark-secondary font-semibold whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-primary/10 dark:bg-white/10" />
    </div>
  );
}

export default SectionDivider;
