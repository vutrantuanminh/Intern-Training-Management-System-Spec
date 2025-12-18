import { Response } from 'express';

// Success response
export const successResponse = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

// Paginated response
export const paginatedResponse = <T>(
    res: Response,
    data: T[],
    pagination: {
        page: number;
        limit: number;
        total: number;
    },
    message?: string
) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages,
            hasMore: pagination.page < totalPages,
        },
    });
};

// Error response
export const errorResponse = (
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: unknown
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
