// ...existing code...
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'admin' | 'user';
export interface JwtPayloadWithRole {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'troque_esta_chave';

export function verifyJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayloadWithRole;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
// ...existing code...
