import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { apiRouter } from "./routes";
import { fail } from "./common/response";
import { ApiError } from "./common/http-errors";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  app.use("/api", apiRouter);

  // Centralized error handler — never leak stack traces or internals.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ApiError) {
      return fail(res, err.statusCode, err.message, err.code);
    }
    console.error(err);
    return fail(res, 500, "Something went wrong", "INTERNAL_ERROR");
  });

  return app;
}
