import type { ApiResponse, AuthResponse, MeResponse } from '@template/shared';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response, Router } from 'express';

import { authenticate, AuthenticatedRequest, signToken } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// POST /api/auth/signup
router.post(
  '/signup',
  async (
    req: Request<object, object, { email: string; name: string; password: string; orgName: string }>,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction,
  ) => {
    try {
      const { email, name, password, orgName } = req.body;

      if (!email || !name || !password || !orgName) {
        res.status(400).json({
          data: null as unknown as AuthResponse,
          message: 'email, name, password, and orgName are required',
        });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({
          data: null as unknown as AuthResponse,
          message: 'Email already in use',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, name, passwordHash },
        });

        const org = await tx.organization.create({
          data: {
            name: orgName,
            pricingPlan: 'token',
            tokenRate: 0.00001,
          },
        });

        await tx.membership.create({
          data: { userId: user.id, orgId: org.id, role: 'admin' },
        });

        return user;
      });

      const token = signToken(result.id);

      res.status(201).json({
        data: {
          token,
          user: {
            id: result.id,
            email: result.email,
            name: result.name,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/login
router.post(
  '/login',
  async (
    req: Request<object, object, { email: string; password: string }>,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          data: null as unknown as AuthResponse,
          message: 'email and password are required',
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({
          data: null as unknown as AuthResponse,
          message: 'Invalid email or password',
        });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({
          data: null as unknown as AuthResponse,
          message: 'Invalid email or password',
        });
        return;
      }

      const token = signToken(user.id);

      res.json({
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<ApiResponse<MeResponse>>, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          memberships: {
            include: { org: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          data: null as unknown as MeResponse,
          message: 'User not found',
        });
        return;
      }

      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          memberships: user.memberships.map((m) => ({
            userId: m.userId,
            orgId: m.orgId,
            role: m.role as 'member' | 'admin',
            org: {
              id: m.org.id,
              name: m.org.name,
              pricingPlan: m.org.pricingPlan as 'token' | 'seat',
              tokenRate: m.org.tokenRate?.toString() ?? null,
              sessionLimit: m.org.sessionLimit,
              billingPeriodStart: m.org.billingPeriodStart.toISOString(),
              createdAt: m.org.createdAt.toISOString(),
              updatedAt: m.org.updatedAt.toISOString(),
            },
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
