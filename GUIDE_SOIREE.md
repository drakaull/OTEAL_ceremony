# Guide de démarrage — soirée cérémonie

## Le site est en ligne — pas d'installation nécessaire

Le site est hébergé et accessible depuis n'importe où (plus besoin d'être sur le même WiFi) :

**🔗 https://oteal-awards-ceremony.up.railway.app**

| Écran | Adresse | Qui l'utilise |
|---|---|---|
| Écran principal (projeté/TV) | `/main` | Personne n'interagit dessus |
| Back-office (créer les catégories) | `/admin/setup` | L'organisateur, **avant** la soirée |
| Panneau admin (pilote la cérémonie) | `/admin/control` | L'organisateur, sur son téléphone ou laptop |
| Vue joueur | `/play` | Chaque invité, sur son téléphone |

Mot de passe admin : `oteal_awards26`

Les invités n'ont pas besoin de taper l'adresse : ils scannent le QR code affiché sur l'écran principal une fois la cérémonie en LOBBY.

## Avant la soirée

Aller sur `/admin/setup`, se connecter avec le mot de passe, et créer toutes les catégories + leurs nommés (avec photos si besoin). Une fois la cérémonie démarrée, cet écran repasse en lecture seule.

## En cas de souci

- **Il faut relancer une nouvelle soirée avec les mêmes catégories qu'avant** : dans le panneau admin, une fois la cérémonie terminée (`ENDED`), le bouton "Remise à zéro" supprime tout (catégories, participants) pour repartir de zéro — il faudra donc recréer les catégories dans `/admin/setup`.
- **Le site semble en panne** : vérifier le statut du service sur [railway.app](https://railway.app) (projet `awake-inspiration`).

---

## Alternative : lancer le site en local (sans hébergement)

Utile pour développer/tester, ou si l'hébergement en ligne n'est pas disponible. Dans ce mode, les téléphones doivent être sur le **même réseau WiFi** que l'ordinateur qui fait tourner le site.

### 1. Une seule fois (installation)

Depuis la racine du projet :

```powershell
npm install
```

Si les fichiers `.env` n'existent pas encore, les créer à partir des exemples :

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

### 2. Trouver l'adresse IP locale de l'ordinateur

Nécessaire pour que les téléphones puissent se connecter. Dans PowerShell :

```powershell
ipconfig
```

Chercher la ligne **Adresse IPv4** de la carte WiFi active (exemple : `192.168.1.42`).

### 3. Configurer les `.env` avec cette IP

Ouvrir `client\.env` et mettre l'IP trouvée à la place de `localhost` :

```
VITE_SERVER_URL=http://192.168.1.42:4000
```

Ouvrir `server\.env` et autoriser toutes les origines (simple pour un usage en réseau local) :

```
CLIENT_ORIGIN="*"
```

*(Sur le PC lui-même, ça continue de marcher normalement même avec l'IP à la place de `localhost`.)*

### 4. Démarrer le serveur et le client

Deux terminaux séparés, à la racine du projet.

**Terminal 1 — serveur :**
```powershell
npm run dev:server
```
Attendre le message `Server listening on port 4000`.

**Terminal 2 — client :**
```powershell
cd client
npx vite --host
```
Le `--host` est important : sans lui, les téléphones ne peuvent pas se connecter.

### 5. Les écrans à utiliser (remplacer `192.168.1.42` par l'IP trouvée à l'étape 2)

| Écran | Adresse |
|---|---|
| Écran principal | `http://localhost:5173/main` |
| Back-office | `http://localhost:5173/admin/setup` |
| Panneau admin | `http://192.168.1.42:5173/admin/control` |
| Vue joueur | `http://192.168.1.42:5173/play` |

### 6. Arrêter à la fin

`Ctrl+C` dans chacun des deux terminaux.

### Souci fréquent en local

**Un téléphone n'arrive pas à rejoindre** : vérifier qu'il est bien sur le même WiFi que l'ordinateur, et que l'étape 3 (IP dans `client\.env` + redémarrage du client) a bien été faite.
