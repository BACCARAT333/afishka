import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import type { AuthController } from './AuthController';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post(
    '/register',
    asyncHandler((req, res) => controller.register(req, res)),
  );
  router.post(
    '/login',
    asyncHandler((req, res) => controller.login(req, res)),
  );
  return router;
}
