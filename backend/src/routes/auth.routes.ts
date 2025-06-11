import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { PasswordResetController } from "../controllers/password-reset.controller";

const router = Router();
const authController = new AuthController();
const passwordResetController = new PasswordResetController();

// Route d'inscription
router.post("/register", authController.register.bind(authController));

// Route de connexion
router.post("/login", authController.login.bind(authController));

// Route de vérification d'email
router.post(
  "/verify-email/:userId",
  authController.verifyEmail.bind(authController)
);

// Routes de réinitialisation de mot de passe
router.post(
  "/forgot-password",
  passwordResetController.forgotPassword.bind(passwordResetController)
);
router.post(
  "/reset-password",
  passwordResetController.resetPassword.bind(passwordResetController)
);

export default router;
