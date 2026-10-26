import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, placeholder, className, onChange }: SearchFieldProps) {
  return (
    <div className={cn("flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900", className)}>
      <Search className="size-4 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
