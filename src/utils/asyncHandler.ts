import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para rotas async
 * Captura erros e passa para o errorHandler
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
