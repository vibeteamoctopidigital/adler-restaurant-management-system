// Vercel serverless entry point.
//
// The Express app is loaded lazily (dynamic import) and wrapped so that any
// failure during initialization — a missing env var, a Prisma engine problem,
// etc. — is caught and returned as a readable JSON 500 instead of an opaque
// `FUNCTION_INVOCATION_FAILED` crash. The app itself is a `(req, res)` handler,
// which is exactly what Vercel invokes. (Local dev still uses `src/server.ts`.)
import { logger } from "../src/utils/logger";

type NodeHandler = (req: unknown, res: unknown) => unknown;

let cachedApp: NodeHandler | undefined;
let initError: unknown;

const loadApp = async (): Promise<void> => {
  if (cachedApp || initError) return;
  try {
    cachedApp = (await import("../src/app")).default as NodeHandler;
  } catch (err) {
    initError = err;
  }
};

export default async function handler(req: any, res: any) {
  await loadApp();

  if (initError) {
    const message = initError instanceof Error ? initError.message : String(initError);
    logger.fatal({ err: initError }, "Backend failed to initialize");
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: "Backend failed to initialize.",
        error: message,
      })
    );
    return;
  }

  return cachedApp!(req, res);
}
