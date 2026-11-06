import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { Button } from "../ui/Button";
export function Header({
  dashboard,
  dark,
  toggleTheme,
  goHome,
}: {
  dashboard: boolean;
  dark: boolean;
  toggleTheme: () => void;
  goHome: () => void;
}) {
  return (
    <header className="site-header">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          goHome();
        }}
        aria-label="SaiLog 홈"
      >
        <span className="brand-symbol" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span translate="no">
          SaiLog<span className="brand-dot">.</span>
        </span>
      </a>
      <nav
        aria-label="주 내비게이션"
        className="flex items-center gap-1 sm:gap-5"
      >
        {!dashboard && (
          <>
            <a className="nav-link inline-flex" href="#how-it-works">
              이용 방법
            </a>
            <a className="nav-link hidden sm:inline-flex" href="#privacy">
              개인정보 보호 <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </>
        )}
        <span className="local-badge hidden md:inline-flex">
          <span /> LOCAL & PRIVATE
        </span>
        <Button
          variant="ghost"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {dark ? (
            <Sun size={19} aria-hidden="true" />
          ) : (
            <Moon size={19} aria-hidden="true" />
          )}
        </Button>
      </nav>
    </header>
  );
}
