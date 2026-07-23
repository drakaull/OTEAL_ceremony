import { useState } from "react";
import { api, imageUrl, type CategoryDto } from "../lib/api";

interface Props {
  password: string;
  category: CategoryDto;
  locked: boolean;
  onChanged: () => void;
}

export function CategoryEditor({ password, category, locked, onChanged }: Props) {
  const [title, setTitle] = useState(category.title);
  const [newNomineeName, setNewNomineeName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveTitle() {
    if (title.trim() === category.title || !title.trim()) return;
    try {
      await api.updateCategory(password, category.id, { title: title.trim() });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function deleteCategory() {
    if (!confirm(`Supprimer la catégorie "${category.title}" et tous ses nommés ?`)) return;
    setBusy(true);
    try {
      await api.deleteCategory(password, category.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setBusy(false);
    }
  }

  async function addNominee(e: React.FormEvent) {
    e.preventDefault();
    if (!newNomineeName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createNominee(password, category.id, { name: newNomineeName.trim() });
      setNewNomineeName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNominee(id: string) {
    setBusy(true);
    try {
      await api.deleteNominee(password, id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function renameNominee(id: string, name: string) {
    try {
      await api.updateNominee(password, id, { name });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function uploadNomineeImage(id: string, file: File) {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(password, file);
      await api.updateNominee(password, id, { imageUrl: url });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card--wide" style={{ marginBottom: 16, textAlign: "left" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          className="input"
          value={title}
          disabled={locked}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
        <button className="btn btn--danger" disabled={locked || busy} onClick={deleteCategory}>
          Supprimer
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {category.nominees.map((nominee) => (
          <div key={nominee.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {nominee.imageUrl ? (
              <img src={imageUrl(nominee.imageUrl)} alt="" width={40} height={40} style={{ objectFit: "cover", borderRadius: 8 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-elevated)" }} />
            )}
            <input
              className="input"
              defaultValue={nominee.name}
              disabled={locked}
              onBlur={(e) => e.target.value.trim() && e.target.value !== nominee.name && renameNominee(nominee.id, e.target.value.trim())}
            />
            <label className="btn btn--secondary" style={{ cursor: locked ? "not-allowed" : "pointer" }}>
              Image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={locked || busy}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadNomineeImage(nominee.id, file);
                }}
              />
            </label>
            <button className="btn btn--danger" disabled={locked || busy} onClick={() => deleteNominee(nominee.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {!locked && (
        <form onSubmit={addNominee} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Nom du nommé"
            value={newNomineeName}
            onChange={(e) => setNewNomineeName(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy}>
            Ajouter
          </button>
        </form>
      )}
    </div>
  );
}
