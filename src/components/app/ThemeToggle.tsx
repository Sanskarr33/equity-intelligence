import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = !dark;
        localStorage.setItem("theme", next ? "dark" : "light");
        setDark(next);
      }}
      className="rounded p-1.5 text-header-foreground/80 hover:bg-header-foreground/10 hover:text-header-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
