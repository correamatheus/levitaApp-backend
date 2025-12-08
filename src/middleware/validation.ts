import type{Request, Response, NextFunction} from 'express'
import { type ZodSchema, ZodError} from 'zod'

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validateData = schema.parse(req.body);
            req.body = validateData;
            next();
        }catch (error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }
            next(error);
        }
    }
}

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        }catch (error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }
            next(error);
        }
    }
}


export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        }catch (error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }
            next(error);
        }
    }
}