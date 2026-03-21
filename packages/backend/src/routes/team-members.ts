import type {
  ApiResponse,
  CreateTeamMemberRequest,
  TeamMember,
  UpdateTeamMemberRequest,
} from '@template/shared';
import { NextFunction, Request, Response, Router } from 'express';

import { prisma } from '../index';

const router = Router();

// Get all team members
router.get(
  '/',
  async (_req: Request, res: Response<ApiResponse<TeamMember[]>>, next: NextFunction) => {
    try {
      const members = await prisma.teamMember.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        data: members.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get single team member
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: req.params.id as string },
    });

    if (!member) {
      return res.status(404).json({ error: 'Not found', message: 'Team member not found' });
    }

    res.json({
      data: {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create team member
router.post(
  '/',
  async (
    req: Request<object, object, CreateTeamMemberRequest>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name, description, gitHandle } = req.body;

      if (!name || !gitHandle) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Name and gitHandle are required',
        });
      }

      const member = await prisma.teamMember.create({
        data: { name, description, gitHandle },
      });

      res.status(201).json({
        data: {
          ...member,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        },
        message: 'Team member created successfully',
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A team member with this git handle already exists',
        });
      }
      next(error);
    }
  }
);

// Update team member
router.put(
  '/:id',
  async (
    req: Request<{ id: string }, object, UpdateTeamMemberRequest>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name, description, gitHandle } = req.body;

      const existing = await prisma.teamMember.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Not found', message: 'Team member not found' });
      }

      const member = await prisma.teamMember.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(gitHandle !== undefined && { gitHandle }),
        },
      });

      res.json({
        data: {
          ...member,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        },
        message: 'Team member updated successfully',
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A team member with this git handle already exists',
        });
      }
      next(error);
    }
  }
);

// Delete team member
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.teamMember.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not found', message: 'Team member not found' });
    }

    await prisma.teamMember.delete({
      where: { id: req.params.id as string },
    });

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
