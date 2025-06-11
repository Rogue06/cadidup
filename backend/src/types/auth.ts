export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  plan: "free" | "premium";
  totalAnalyses: number;
  freeAnalysesUsed: number;
  cvOptimizationsUsed: number;
  coverLettersUsed: number;
  deviceFingerprint?: string;
  registrationIp?: string;
  lastAnalysisIp?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due";
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  deviceFingerprint?: string;
  registrationIp?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  deviceFingerprint?: string;
}

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  token: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
