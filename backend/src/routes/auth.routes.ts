import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController();

// Route d'inscription
router.post("/register", authController.register.bind(authController));

// Route de connexion
router.post("/login", authController.login.bind(authController));

// Route de vérification d'email
router.post(
  "/verify-email/:userId",
  authController.verifyEmail.bind(authController)
);

export default router;
