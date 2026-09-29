import type { Request, Response } from 'express';
import { handlers } from '../../src/server/handlers';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    return handlers.handleTestInbound(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
