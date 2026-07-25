import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="screen screen--centered">
      <h1>404</h1>
      <p className="muted">Cette page n'existe pas.</p>
      <Link className="btn" to="/main" style={{ marginTop: 16 }}>
        Retour à l'écran principal
      </Link>
    </div>
  );
}
