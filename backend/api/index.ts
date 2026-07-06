// Vercel serverless entry point.
//
// This module has ZERO fallible top-level imports so it always loads. The
// Express app is imported lazily inside the handler and wrapped in try/catch,
// so ANY initialization failure (missing env var, Prisma/engine problem, bad
// import, …) is reported as a readable JSON 500 and logged to stderr (visible
// in Vercel's Runtime Logs) instead of an opaque `FUNCTION_INVOCATION_FAILED`.
//
// An Express app is itself a `(req, res)` handler, which is what Vercel invokes.
// (Local dev still uses `src/server.ts`, which calls `app.listen()`.)

type NodeHandler = (req: unknown, res: unknown) => unknown;

export default async function handler(req: any, res: any) {
  try {
    // Node caches this module (and any load error) after the first import, so
    // repeated calls are cheap and a failed init keeps reporting the same cause.
    const app = ((await import("../src/app")).default as unknown) as NodeHandler;
    return app(req, res);
  } catch (err: any) {
    const message = err?.message ?? String(err);
    // eslint-disable-next-line no-console
    console.error("Backend failed to initialize:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: "Backend failed to initialize.",
        error: message,
      })
    );
  }
}
