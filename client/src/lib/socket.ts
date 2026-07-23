import { io } from "socket.io-client";

// Unset in production: client and server share an origin there (one Railway
// service), so connecting with no URL targets the page's own origin.
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const socket = io(SERVER_URL || undefined, { autoConnect: true });
