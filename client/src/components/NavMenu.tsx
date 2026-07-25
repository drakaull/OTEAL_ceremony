import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameProvider";

const LINKS = [
  { to: "/main", label: "Écran principal" },
  { to: "/play", label: "Vue joueur" },
  { to: "/admin/control", label: "Panneau admin" },
  { to: "/admin/setup", label: "Back-office" },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const { isAdmin, adminAction } = useGame();

  async function handleCancelCeremony() {
    if (
      !confirm(
        "Annuler la cérémonie en cours et repartir de zéro ? Les participants et les votes seront supprimés, mais les catégories sont conservées.",
      )
    ) {
      return;
    }
    await adminAction("admin:cancelCeremony");
    setOpen(false);
  }

  return (
    <div className="nav-menu">
      <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        ☰
      </button>

      {open && (
        <>
          <div className="nav-overlay" onClick={() => setOpen(false)} />
          <nav className="nav-panel">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="nav-link" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <hr className="nav-separator" />
                <button className="nav-link nav-link--danger" onClick={handleCancelCeremony}>
                  Annuler la cérémonie et recommencer
                </button>
              </>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
