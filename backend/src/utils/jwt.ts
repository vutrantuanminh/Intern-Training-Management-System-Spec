import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
    userId: number;
    email: string;
    roles: string[];
}

export interface RefreshTokenPayload {
    userId: number;
    tokenId: string;
}

// Generate access token
export const generateAccessToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.jwtSecret, options);
};

// Generate refresh token
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
    const options: SignOptions = {
        expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.jwtRefreshSecret, options);
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
};

// Verify refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
};

// Generate email verification token
export const generateVerifyToken = (): string => {
    return jwt.sign({ type: 'email_verify' }, env.jwtSecret, { expiresIn: '24h' });
};

// Generate password reset token
export const generateResetToken = (): string => {
    return jwt.sign({ type: 'password_reset' }, env.jwtSecret, { expiresIn: '1h' });
};
