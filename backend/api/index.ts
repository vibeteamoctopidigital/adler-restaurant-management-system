// Vercel serverless entry point.
//
// Vercel invokes the module's default export as the request handler, and an
// Express application *is* a `(req, res) => void` handler — so we export the
// configured app directly. No `app.listen()` runs here (that only happens in
// `src/server.ts`, which is used for local development).
import app from "../src/app";

export default app;
