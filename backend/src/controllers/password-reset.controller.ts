import { Request, Response } from "express";
import { PasswordResetService } from "../services/password-reset.service";
import { ForgotPasswordDTO, ResetPasswordDTO } from "../types/auth";

export class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor() {
    this.passwordResetService = new PasswordResetService();
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const data: ForgotPasswordDTO = req.body;
      await this.passwordResetService.requestPasswordReset(data);
      res.json({
        message:
          "Si votre email existe dans notre base de données, vous recevrez un email de réinitialisation",
      });
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : "Une erreur est survenue",
        });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const data: ResetPasswordDTO = req.body;
      await this.passwordResetService.resetPassword(data);
      res.json({
        message: "Votre mot de passe a été réinitialisé avec succès",
      });
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : "Une erreur est survenue",
        });
    }
  }
}
