import { useState } from "react";
import { useGame } from "../context/GameProvider";
import { CountdownTimer } from "./CountdownTimer";

export function ParticipantExperience() {
  const { connected, state, participant, joinStatus, reclaimOffer, joinError, myVote, join, confirmReclaim, cancelReclaim, castVote } =
    useGame();
  const [pseudoInput, setPseudoInput] = useState("");
  const [voteError, setVoteError] = useState<string | null>(null);

  if (!connected || joinStatus === "idle" || joinStatus === "checking-token") {
    return <p className="muted">Connexion…</p>;
  }

  if (joinStatus === "reclaim-offer" && reclaimOffer) {
    return (
      <div className="card">
        <h2>Êtes-vous {reclaimOffer.pseudo} ?</h2>
        <p className="muted">Ce pseudo était utilisé par quelqu'un qui s'est déconnecté.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--block" onClick={confirmReclaim}>
            Oui, c'est moi
          </button>
          <button className="btn btn--secondary btn--block" onClick={cancelReclaim}>
            Non
          </button>
        </div>
      </div>
    );
  }

  if (joinStatus === "need-pseudo" || joinStatus === "taken") {
    return (
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (pseudoInput.trim()) join(pseudoInput.trim());
        }}
      >
        <h2>Rejoindre la soirée</h2>
        <input
          className="input"
          placeholder="Votre pseudo"
          value={pseudoInput}
          onChange={(e) => setPseudoInput(e.target.value)}
          autoFocus
        />
        {joinStatus === "taken" ? <p className="error-text">Ce pseudo est déjà pris.</p> : null}
        {joinError ? <p className="error-text">{joinError}</p> : null}
        <button className="btn btn--block" type="submit" style={{ marginTop: 12 }}>
          Rejoindre
        </button>
      </form>
    );
  }

  // joined
  if (!state) return <p className="muted">Chargement de la partie…</p>;

  async function vote(nomineeId: string) {
    if (!state?.currentCategory) return;
    setVoteError(null);
    const ack = await castVote(state.currentCategory.id, nomineeId);
    if (ack.status === "error") setVoteError(ack.message);
  }

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p className="badge">👤 {participant?.pseudo}</p>

      {state.phase === "LOBBY" && (
        <>
          <h2 style={{ marginTop: 16 }}>Vous êtes dans la partie !</h2>
          <p className="muted">En attente du début de la cérémonie…</p>
        </>
      )}

      {state.phase === "INTRO" && state.currentCategory && (
        <>
          <h2 style={{ marginTop: 16 }}>{state.currentCategory.title}</h2>
          <p className="muted">Regardez l'écran principal — le vote va commencer.</p>
        </>
      )}

      {state.phase === "VOTING" && state.currentCategory && (
        <>
          <h2 style={{ marginTop: 16 }}>{state.currentCategory.title}</h2>
          {state.timerEndsAt ? <CountdownTimer endsAt={state.timerEndsAt} /> : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {state.currentCategory.nominees.map((nominee) => (
              <button
                key={nominee.id}
                type="button"
                className={`nominee-card ${myVote === nominee.id ? "selected" : ""}`}
                onClick={() => vote(nominee.id)}
              >
                <span className="nominee-name">{nominee.name}</span>
              </button>
            ))}
          </div>
          {voteError ? <p className="error-text">{voteError}</p> : null}
          {myVote ? <p className="muted" style={{ marginTop: 8 }}>Vous pouvez changer d'avis jusqu'à la fin du timer.</p> : null}
        </>
      )}

      {state.phase === "VOTE_CLOSED" && (
        <>
          <h2 style={{ marginTop: 16 }}>Vote clos</h2>
          <p className="muted">En attente de la révélation…</p>
        </>
      )}

      {state.phase === "REVEALING" && (
        <>
          <h2 style={{ marginTop: 16 }}>👀 Regardez l'écran principal !</h2>
        </>
      )}

      {state.phase === "RECAP" && (
        <>
          <h2 style={{ marginTop: 16 }}>🏆 Regardez l'écran principal pour le palmarès !</h2>
        </>
      )}

      {state.phase === "ENDED" && (
        <>
          <h2 style={{ marginTop: 16 }}>Merci d'avoir participé !</h2>
          <p className="muted">La cérémonie est terminée.</p>
        </>
      )}
    </div>
  );
}
