import { Pool } from "pg";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { ForgotPasswordDTO, ResetPasswordDTO } from "../types/auth";
import pool from "../config/database";
import { sendEmail } from "../utils/email";

export class PasswordResetService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async requestPasswordReset(data: ForgotPasswordDTO): Promise<void> {
    const { email } = data;

    // Vérifier si l'utilisateur existe
    const userResult = await this.pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return;
    }

    const userId = userResult.rows[0].id;

    // Générer un token unique
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Le token expire dans 1 heure

    // Sauvegarder le token
    await this.pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    // Envoyer l'email de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
      `,
    });
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    const { token, password, confirmPassword } = data;

    if (password !== confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    // Vérifier le token
    const tokenResult = await this.pool.query(
      `SELECT prt.*, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error("Token invalide ou expiré");
    }

    const { user_id, email } = tokenResult.rows[0];

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Mettre à jour le mot de passe
    await this.pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      user_id,
    ]);

    // Marquer le token comme utilisé
    await this.pool.query(
      "UPDATE password_reset_tokens SET used = true WHERE token = $1",
      [token]
    );

    // Envoyer un email de confirmation
    await sendEmail({
      to: email,
      subject: "Votre mot de passe a été modifié",
      html: `
        <p>Bonjour,</p>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <p>Si vous n'êtes pas à l'origine de cette modification, veuillez contacter immédiatement notre support.</p>
      `,
    });
  }
}
