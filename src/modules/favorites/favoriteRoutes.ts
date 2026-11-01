import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import type { FavoriteController } from './FavoriteController';

export function createFavoriteRouter(
  controller: FavoriteController,
  requireAuth: RequestHandler,
): Router {
  const router = Router();
  router.use(requireAuth);
  router.get(
    '/',
    asyncHandler((req, res) => controller.list(req, res)),
  );
  router.post(
    '/:eventId',
    asyncHandler((req, res) => controller.add(req, res)),
  );
  router.delete(
    '/:eventId',
    asyncHandler((req, res) => controller.remove(req, res)),
  );
  return router;
}
