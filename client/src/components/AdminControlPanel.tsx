import { useState } from "react";
import { useGame } from "../context/GameProvider";
import { api } from "../lib/api";

const SESSION_KEY = "oteal_admin_password";

export function AdminControlPanel() {
  const { state, isAdmin, adminError, authenticateAdmin, adminAction } = useGame();
  const [passwordInput, setPasswordInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const ok = await authenticateAdmin(passwordInput);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, passwordInput);
      setAdminPassword(passwordInput);
    }
  }

  async function run(event: Parameters<typeof adminAction>[0]) {
    setBusy(true);
    await adminAction(event);
    setBusy(false);
  }

  async function downloadPdf() {
    if (!adminPassword) return;
    const res = await fetch(api.exportPdfUrl(), { headers: { "x-admin-password": adminPassword } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palmares-ceremonie.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isAdmin) {
    return (
      <form className="card" onSubmit={handleLogin} style={{ marginTop: 16 }}>
        <h2>Panneau admin</h2>
        <input
          className="input"
          type="password"
          placeholder="Mot de passe admin"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
        {adminError ? <p className="error-text">{adminError}</p> : null}
        <button className="btn btn--block" type="submit" style={{ marginTop: 12 }}>
          Déverrouiller les contrôles
        </button>
      </form>
    );
  }

  const phase = state?.phase;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>Contrôles</h2>
      {adminError ? <p className="error-text">{adminError}</p> : null}

      {phase === "LOBBY" && (
        <button className="btn btn--block" disabled={busy} onClick={() => run("admin:startCeremony")}>
          Démarrer la cérémonie
        </button>
      )}

      {phase === "INTRO" && (
        <button className="btn btn--block" disabled={busy} onClick={() => run("admin:startVoting")}>
          Lancer le vote
        </button>
      )}

      {phase === "VOTING" && <p className="muted">Vote en cours… fermeture automatique à la fin du minuteur.</p>}

      {(phase === "VOTE_CLOSED" || phase === "REVEALING") &&
        (state && state.revealedPlaces.length < state.totalPlaces ? (
          <button className="btn btn--block" disabled={busy} onClick={() => run("admin:reveal")}>
            Révéler {state.revealedPlaces.length === 0 ? "le podium" : "la suite"}
          </button>
        ) : (
          <button className="btn btn--block" disabled={busy} onClick={() => run("admin:nextCategory")}>
            Catégorie suivante
          </button>
        ))}

      {phase === "RECAP" && (
        <button className="btn btn--block" disabled={busy} onClick={() => run("admin:endCeremony")}>
          Terminer la cérémonie
        </button>
      )}

      {(phase === "RECAP" || phase === "ENDED") && (
        <button className="btn btn--secondary btn--block" style={{ marginTop: 8 }} onClick={downloadPdf}>
          Télécharger le PDF du palmarès
        </button>
      )}

      {phase === "ENDED" && (
        <button
          className="btn btn--danger btn--block"
          style={{ marginTop: 8 }}
          disabled={busy}
          onClick={() => {
            if (confirm("Remettre à zéro pour une prochaine soirée ? Toutes les catégories et tous les participants seront supprimés.")) {
              run("admin:reset");
            }
          }}
        >
          Remise à zéro (nouvelle soirée)
        </button>
      )}
    </div>
  );
}
