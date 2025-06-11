import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { RegisterDTO, LoginDTO, AuthResponse, User } from "../types/auth";
import pool from "../config/database";

export class AuthService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    const {
      email,
      password,
      firstName,
      lastName,
      deviceFingerprint,
      registrationIp,
    } = data;

    // Vérifier si l'email existe déjà
    const existingUser = await this.pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("Cet email est déjà utilisé");
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const result = await this.pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name,
        device_fingerprint, registration_ip
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        email,
        passwordHash,
        firstName,
        lastName,
        deviceFingerprint,
        registrationIp,
      ]
    );

    const user = this.mapUserFromDB(result.rows[0]);
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const { email, password, deviceFingerprint } = data;

    // Récupérer l'utilisateur
    const result = await this.pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Mettre à jour le device fingerprint si fourni
    if (deviceFingerprint) {
      await this.pool.query(
        "UPDATE users SET device_fingerprint = $1 WHERE id = $2",
        [deviceFingerprint, user.id]
      );
    }

    const mappedUser = this.mapUserFromDB(user);
    const token = this.generateToken(mappedUser);

    return { user: mappedUser, token };
  }

  async verifyEmail(userId: number): Promise<void> {
    await this.pool.query(
      "UPDATE users SET email_verified = true WHERE id = $1",
      [userId]
    );
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
  }

  private mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      emailVerified: dbUser.email_verified,
      plan: dbUser.plan,
      totalAnalyses: dbUser.total_analyses,
      freeAnalysesUsed: dbUser.free_analyses_used,
      cvOptimizationsUsed: dbUser.cv_optimizations_used,
      coverLettersUsed: dbUser.cover_letters_used,
      deviceFingerprint: dbUser.device_fingerprint,
      registrationIp: dbUser.registration_ip,
      lastAnalysisIp: dbUser.last_analysis_ip,
      stripeCustomerId: dbUser.stripe_customer_id,
      subscriptionStatus: dbUser.subscription_status,
      subscriptionExpiresAt: dbUser.subscription_expires_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }
}
