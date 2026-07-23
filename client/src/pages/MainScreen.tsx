import { useGame } from "../context/GameProvider";
import { JoinQrCode } from "../components/JoinQrCode";
import { CountdownTimer } from "../components/CountdownTimer";
import { imageUrl } from "../lib/api";
import type { PodiumPlace } from "../types";

function rankLabel(rank: number) {
  return rank === 1 ? "1er" : `${rank}e`;
}

function PodiumPlaceRow({ place }: { place: PodiumPlace }) {
  return (
    <div className="podium-place">
      <span className="podium-rank">{rankLabel(place.rank)}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: 1 }}>
        {place.nominees.map((nominee) => (
          <div key={nominee.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {nominee.imageUrl ? <img className="podium-nominee-img" src={imageUrl(nominee.imageUrl)} alt="" /> : null}
            <span>{nominee.name}</span>
          </div>
        ))}
      </div>
      <span className="podium-percentage">{place.nominees[0]?.percentage ?? 0}%</span>
    </div>
  );
}

export function MainScreen() {
  const { state, lobbyParticipants, votesProgress } = useGame();

  if (!state) {
    return (
      <div className="screen screen--centered">
        <p className="muted">Connexion au serveur…</p>
      </div>
    );
  }

  if (state.phase === "LOBBY") {
    return (
      <div className="screen screen--centered">
        <h1>🏆 Cérémonie des Oscars</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Scannez pour rejoindre
        </p>
        <JoinQrCode />
        <div style={{ marginTop: 32 }}>
          <p className="badge">{lobbyParticipants.length} participant{lobbyParticipants.length > 1 ? "s" : ""}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
            {lobbyParticipants.map((pseudo) => (
              <span key={pseudo} className="badge">
                {pseudo}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if ((state.phase === "INTRO" || state.phase === "VOTING" || state.phase === "VOTE_CLOSED") && state.currentCategory) {
    const voterSet = new Set(votesProgress?.voterPseudos ?? []);
    return (
      <div className="screen">
        <h1>{state.currentCategory.title}</h1>
        {state.phase === "VOTING" && state.timerEndsAt ? <CountdownTimer endsAt={state.timerEndsAt} /> : null}
        {state.phase === "VOTE_CLOSED" ? <p className="muted">Vote terminé — préparation de la révélation…</p> : null}

        <div className="nominee-grid" style={{ marginTop: 24, maxWidth: 900 }}>
          {state.currentCategory.nominees.map((nominee) => (
            <div key={nominee.id} className="nominee-card" style={{ cursor: "default" }}>
              {nominee.imageUrl ? <img src={imageUrl(nominee.imageUrl)} alt="" /> : null}
              <div className="nominee-name">{nominee.name}</div>
            </div>
          ))}
        </div>

        {state.phase === "VOTING" && votesProgress ? (
          <div style={{ marginTop: 32, width: "100%", maxWidth: 700 }}>
            <p className="badge">
              {votesProgress.voted}/{votesProgress.total} ont voté
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 12 }}>
              {lobbyParticipants.map((pseudo) => (
                <span key={pseudo} className="badge" style={{ opacity: voterSet.has(pseudo) ? 1 : 0.35 }}>
                  {voterSet.has(pseudo) ? "✅" : "⏳"} {pseudo}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (state.phase === "REVEALING" && state.currentCategory) {
    return (
      <div className="screen">
        <h1>{state.currentCategory.title}</h1>
        <div style={{ width: "100%", maxWidth: 700, marginTop: 24 }}>
          {[...state.revealedPlaces].reverse().map((place) => (
            <PodiumPlaceRow key={place.rank} place={place} />
          ))}
        </div>
        {state.revealedPlaces.length < state.totalPlaces ? (
          <p className="muted" style={{ marginTop: 24 }}>
            La suite arrive…
          </p>
        ) : null}
      </div>
    );
  }

  if (state.phase === "RECAP") {
    return (
      <div className="screen">
        <h1>🏆 Palmarès de la soirée</h1>
        <div style={{ width: "100%", maxWidth: 700 }}>
          {state.recap.map((entry) => (
            <div key={entry.categoryId} className="card card--wide" style={{ marginBottom: 16, textAlign: "left" }}>
              <h3>{entry.title}</h3>
              {entry.podium.map((place) => (
                <PodiumPlaceRow key={place.rank} place={place} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="screen screen--centered">
      <h1>🎬 Merci et à bientôt !</h1>
    </div>
  );
}
