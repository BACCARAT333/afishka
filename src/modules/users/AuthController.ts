import type { Request, Response } from 'express';
import type { AuthService } from './AuthService';
import { parseLogin, parseRegistration } from './credentials';

export class AuthController {
  public constructor(private readonly service: AuthService) {}

  public async register(req: Request, res: Response): Promise<void> {
    const { user, token } = await this.service.register(parseRegistration(req.body));
    res.status(201).json({ user: user.toJSON(), token });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const { user, token } = await this.service.login(parseLogin(req.body));
    res.json({ user: user.toJSON(), token });
  }
}
