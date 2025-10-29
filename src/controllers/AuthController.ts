import { NextFunction, Response } from 'express'
import { AuthRequest, RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService'
import createHttpError from 'http-errors'
import { CredentialService } from '../services/CredentialService'
import { User } from '../entity/User'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    private extractErrorMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err)
    }

    private handleValidationErrors(
        req: RegisterUserRequest,
        res: Response,
    ): boolean {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() })
            return true
        }
        return false
    }

    private async generateAndSetTokens(
        res: Response,
        user: User,
    ): Promise<void> {
        const payload: JwtPayload = {
            sub: String(user.id),
            role: user.role,
        }

        const accessToken = this.tokenService.generateAccessToken(payload)
        const newRefreshToken =
            await this.tokenService.persistRefreshToken(user)
        const refreshToken = this.tokenService.generateRefreshToken({
            ...payload,
            id: String(newRefreshToken.id),
        })

        res.cookie('accessToken', accessToken, {
            domain: 'localhost',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
        })
        res.cookie('refreshToken', refreshToken, {
            domain: 'localhost',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true,
        })
    }

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        if (this.handleValidationErrors(req, res)) return
        const { firstName, lastName, email, password } = req.body
        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '*****',
        })
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })
            this.logger.info('User registered successfully', {
                userId: user.id,
            })
            await this.generateAndSetTokens(res, user)
            res.status(201).json({ id: user.id })
        } catch (err) {
            this.logger.error('User registration failed', {
                email,
                error: this.extractErrorMessage(err),
            })
            next(err)
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        if (this.handleValidationErrors(req, res)) return
        const { email, password } = req.body
        this.logger.debug('New request to login a user', {
            email,
            password: '*****',
        })
        try {
            const user = await this.userService.findByEmail(email)
            if (!user) throw createHttpError(400, 'Invalid credentials')

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            )
            if (!passwordMatch)
                throw createHttpError(400, 'Invalid credentials')

            this.logger.info('User authenticated successfully', {
                userId: user.id,
            })
            await this.generateAndSetTokens(res, user)
            res.json({ id: user.id })
        } catch (err) {
            this.logger.warn('Login failed', {
                email,
                error: this.extractErrorMessage(err),
            })
            next(err)
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub))
        if (!user) throw createHttpError(404, 'User with token not found')
        res.json({ ...user, password: undefined })
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)
            const user = await this.userService.findById(Number(req.auth.sub))
            if (!user) throw createHttpError(400, 'User with token not found')
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })
            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60,
                httpOnly: true,
            })
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true,
            })
            this.logger.info('Tokens refreshed successfully', {
                userId: user.id,
            })
            res.json({ id: user.id })
        } catch (err) {
            this.logger.error('Token refresh failed', {
                error: this.extractErrorMessage(err),
            })
            next(err)
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))
            this.logger.info('Refresh token deleted', { tokenId: req.auth.id })
            this.logger.info('User logged out successfully', {
                userId: req.auth.sub,
            })
            res.clearCookie('accessToken')
            res.clearCookie('refreshToken')
            res.json({})
        } catch (err) {
            this.logger.error('Logout failed', {
                userId: req.auth.sub,
                error: this.extractErrorMessage(err),
            })
            next(err)
        }
    }
}
