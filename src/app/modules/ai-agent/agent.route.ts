// ai-agent.routes.ts
import express from 'express';
import { AIAgentController } from './agent.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
const router = express.Router();

router.get('/',auth(Role.super_admin), AIAgentController.getAllAIAgents);

export const AIAgentRoutes = router;