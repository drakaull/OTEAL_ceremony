# OTEAL Ceremony

Application de cérémonie de récompenses interactive ("Oscars" entre potes) : un écran principal pilote le déroulement, les participants votent en temps réel depuis leur téléphone.

## Structure

- `client/` — frontend React + TypeScript (Vite)
- `server/` — backend Node + TypeScript (Express, Socket.io, Prisma/SQLite)

## Développement

```bash
npm install
npm run dev:server
npm run dev:client
```

## Instance en ligne

- **URL** : https://oteal-awards-ceremony.up.railway.app
- Écran principal : `/main`
- Back-office (catégories/nommés) : `/admin/setup`
- Panneau admin (pilotage de la cérémonie) : `/admin/control`
- Vue joueur : `/play`
- Mot de passe admin : `oteal_awards26`

## Déploiement (Railway)

Le serveur sert à la fois l'API/WebSocket et le build du client (un seul service, un seul process Node) :

1. Créer un projet Railway à partir de ce repo.
2. Ajouter un **volume** persistant, monté par exemple sur `/data` (nécessaire pour que la base SQLite et les images uploadées survivent aux redéploiements).
3. Définir les variables d'environnement du service :
   - `ADMIN_PASSWORD` — mot de passe admin de la soirée
   - `DATABASE_URL=file:/data/prod.db`
   - `UPLOADS_DIR=/data/uploads`
   - `VOTE_DURATION_SECONDS` (optionnel, 30 par défaut)
   - ne pas définir `CLIENT_ORIGIN` ni `VITE_SERVER_URL` : client et serveur sont sur la même origine en production
4. Railway (Nixpacks) détecte automatiquement les scripts `build` et `start` du `package.json` racine : `npm run build` construit le client puis le serveur, `npm run start` applique les migrations Prisma puis lance le serveur (qui sert aussi le build du client).
