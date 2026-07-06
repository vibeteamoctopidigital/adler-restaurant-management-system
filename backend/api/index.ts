// Vercel serverless entry point.
//
// A STATIC import is required so Vercel/esbuild bundles the whole app into this
// function (a dynamic import would be left as a runtime module lookup and fail).
// The Express app is itself a `(req, res)` handler, which is what Vercel
// invokes. Initialization is crash-safe: env validation no longer throws (bad
// config is reported per-request by the env-guard middleware), and runtime
// errors go through the app's error handler — so there's no opaque
// `FUNCTION_INVOCATION_FAILED`. (Local dev still uses `src/server.ts`.)
import app from "../src/app";

export default app;
