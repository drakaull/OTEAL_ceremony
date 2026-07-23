import { useEffect, useState } from "react";
import { api, ApiError, type CategoryDto } from "../lib/api";
import { CategoryEditor } from "../components/CategoryEditor";

const SESSION_KEY = "oteal_admin_password";

export function AdminSetup() {
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [locked, setLocked] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh(pwd: string) {
    setLoading(true);
    try {
      const [status, list] = await Promise.all([api.adminStatus(pwd), api.listCategories(pwd)]);
      setLocked(status.phase !== "LOBBY");
      setCategories(list);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        setPassword(null);
      } else {
        setError(err instanceof Error ? err.message : "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (password) refresh(password);
  }, [password]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      await api.adminLogin(passwordInput);
      sessionStorage.setItem(SESSION_KEY, passwordInput);
      setPassword(passwordInput);
    } catch {
      setAuthError("Mot de passe incorrect.");
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !newCategoryTitle.trim()) return;
    try {
      await api.createCategory(password, newCategoryTitle.trim());
      setNewCategoryTitle("");
      refresh(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (!password) {
    return (
      <div className="screen screen--centered">
        <form className="card" onSubmit={handleLogin}>
          <h1>Back-office</h1>
          <p className="muted">Configuration des catégories avant la soirée.</p>
          <input
            className="input"
            type="password"
            placeholder="Mot de passe admin"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {authError ? <p className="error-text">{authError}</p> : null}
          <button className="btn btn--block" type="submit" style={{ marginTop: 12 }}>
            Entrer
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Back-office</h1>

      {locked && (
        <p className="badge" style={{ marginBottom: 16 }}>
          🔒 La cérémonie a démarré : configuration en lecture seule.
        </p>
      )}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Chargement…</p> : null}

      {categories.map((category) => (
        <CategoryEditor
          key={category.id}
          password={password}
          category={category}
          locked={locked}
          onChanged={() => refresh(password)}
        />
      ))}

      {!locked && (
        <form onSubmit={addCategory} className="card card--wide" style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Nouvelle catégorie (ex: Meilleure coupe de cheveux)"
            value={newCategoryTitle}
            onChange={(e) => setNewCategoryTitle(e.target.value)}
          />
          <button className="btn" type="submit">
            Ajouter la catégorie
          </button>
        </form>
      )}
    </div>
  );
}
