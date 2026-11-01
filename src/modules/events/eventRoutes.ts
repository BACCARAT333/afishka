import { Router } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import type { EventController } from './EventController';

export function createEventRouter(controller: EventController): Router {
  const router = Router();
  router.get(
    '/',
    asyncHandler((req, res) => controller.list(req, res)),
  );
  router.get(
    '/:id',
    asyncHandler((req, res) => controller.get(req, res)),
  );
  return router;
}
