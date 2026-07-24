# Guide de démarrage — soirée cérémonie

Ce guide explique comment lancer le site pour une soirée, tant qu'il n'est pas encore déployé en ligne (voir `README.md` pour le déploiement Railway).

Le site tourne en local sur l'ordinateur qui sert d'écran principal. Les téléphones des participants doivent être connectés au **même réseau WiFi** que cet ordinateur pour pouvoir rejoindre.

## 1. Une seule fois (installation)

Depuis la racine du projet :

```powershell
npm install
```

Si les fichiers `.env` n'existent pas encore, les créer à partir des exemples :

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Ouvrir `server\.env` et changer `ADMIN_PASSWORD` si besoin (c'est le mot de passe pour accéder au back-office et au panneau admin).

## 2. Trouver l'adresse IP locale de l'ordinateur

Nécessaire pour que les téléphones puissent se connecter. Dans PowerShell :

```powershell
ipconfig
```

Chercher la ligne **Adresse IPv4** de la carte WiFi active (exemple : `192.168.1.42`).

## 3. Configurer les `.env` avec cette IP

Ouvrir `client\.env` et mettre l'IP trouvée à la place de `localhost` :

```
VITE_SERVER_URL=http://192.168.1.42:4000
```

Ouvrir `server\.env` et autoriser toutes les origines (simple pour un usage en réseau local) :

```
CLIENT_ORIGIN="*"
```

*(Sur le PC lui-même, ça continue de marcher normalement même avec l'IP à la place de `localhost`.)*

## 4. Démarrer le serveur et le client

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

## 5. Préparer les catégories AVANT que les invités arrivent

Aller sur `http://localhost:5173/admin/setup` (mot de passe : celui de `ADMIN_PASSWORD`), et créer toutes les catégories + leurs nommés (avec photos si besoin). Une fois la cérémonie démarrée, cet écran repasse en lecture seule.

## 6. Les écrans à utiliser le soir J

Remplacer `192.168.1.42` par l'IP trouvée à l'étape 2.

| Écran | Adresse | Qui l'utilise |
|---|---|---|
| Écran principal (projeté/TV) | `http://localhost:5173/main` | Personne n'interagit dessus |
| Panneau admin (contrôle la cérémonie) | `http://192.168.1.42:5173/admin/control` | L'organisateur, sur son propre téléphone ou laptop |
| Vue joueur | `http://192.168.1.42:5173/play` | Chaque invité, sur son téléphone |

Les invités n'ont pas besoin de taper l'adresse : ils scannent le QR code affiché sur l'écran principal une fois la cérémonie en LOBBY.

## 7. Arrêter à la fin

`Ctrl+C` dans chacun des deux terminaux.

## En cas de souci

- **Un téléphone n'arrive pas à rejoindre** : vérifier qu'il est bien sur le même WiFi que l'ordinateur, et que l'étape 3 (IP dans `client\.env` + redémarrage du client) a bien été faite.
- **Il faut relancer une nouvelle soirée avec les mêmes catégories qu'avant** : dans le panneau admin, une fois la cérémonie terminée (`ENDED`), le bouton "Remise à zéro" supprime tout (catégories, participants) pour repartir de zéro — il faudra donc recréer les catégories dans `/admin/setup`.
