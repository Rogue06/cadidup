import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { RegisterDTO, LoginDTO } from "../types/auth";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response) {
    try {
      const data: RegisterDTO = {
        ...req.body,
        deviceFingerprint: req.headers["x-device-fingerprint"] as string,
        registrationIp: req.ip,
      };

      const result = await this.authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data: LoginDTO = {
        ...req.body,
        deviceFingerprint: req.headers["x-device-fingerprint"] as string,
      };

      const result = await this.authService.login(data);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      await this.authService.verifyEmail(parseInt(userId));
      res.json({ message: "Email vérifié avec succès" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}
