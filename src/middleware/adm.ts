import {Request, Response, NextFunction} from 'express'

interface RequestAuth extends Request{
    usuarioId?: string
    tipo?: string
}

const adminAuth = (req: RequestAuth, res: Response, next: NextFunction) => {
  // Middleware Auth deve rodar antes, definindo req.tipo
  const tipo = (req.tipo ?? '').toString().toUpperCase()
  if (tipo !== 'ADMIN') {
    return res.status(403).json({ mensagem: 'Acesso apenas para administradores' });
  }
  next();
};

export { adminAuth };