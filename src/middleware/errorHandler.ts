import { Request, Response, NextFunction } from 'express';

// tipos de erro conhecidos
interface ApiError extends Error {
    status?: number;
    details?: any;
}

export class ValidationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export const errorHandler = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // log completo do erro (para debug)
    console.error('Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        details: error.details
    });

    // erros específicos da API
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            message: 'Você precisa estar logado para acessar este recurso'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: error.message,
            details: error.details
        });
    }

    if (error.name === 'NotFoundError') {
        return res.status(404).json({
            message: error.message || 'O recurso solicitado não foi encontrado'
        });
    }

    // erros de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expirado'
        });
    }

    // erros do MongoDB
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        if ((error as any).code === 11000) {
            return res.status(409).json({
                message: 'Registro duplicado'
            });
        }
    }

    // erro genérico (500)
    return res.status(error.status || 500).json({
        message: error.message || 'Erro interno do servidor'
    });
};

export default errorHandler;