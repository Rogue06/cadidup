import { Router } from "express";
import { z } from "zod";
import { logger } from "@/utils/logger";

export const sampleRouter = Router();

sampleRouter.get("/sample", (req, res) => {
  logger.info({ path: req.path, method: req.method }, "hit /sample");
  res.json({ status: "ok" });
});
