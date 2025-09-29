// ai-agent.routes.ts
import express from 'express';
import { AIAgentController } from './agent.controller';
const router = express.Router();

router.get('/', AIAgentController.getAllAIAgents);

export const AIAgentRoutes = router;