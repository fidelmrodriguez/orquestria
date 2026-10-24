import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/store/board-store";

type ThemeToggleProps = {
  theme: ThemeMode;
  className?: string;
  onChangeTheme: (theme: ThemeMode) => void;
};

export function ThemeToggle({ theme, className = "icon-button", onChangeTheme }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChangeTheme(theme === "light" ? "dark" : "light")}
      className={className}
      aria-label="Alternar tema"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
