import { expressjwt } from 'express-jwt'
import { Config } from '../config'
import { Request } from 'express'
import { AppDataSource } from '../config/data-source'
import { RefreshToken } from '../entity/RefreshToken'
import logger from '../config/logger'
import { IRefreshPayload } from '../types'

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ['HS256'],

    getToken(req: Request) {
        const { refreshToken } =
            (req.cookies as { refreshToken?: string } | undefined) ?? {}
        return refreshToken
    },

    async isRevoked(req: Request, token) {
        try {
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
            const refreshToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number((token?.payload as IRefreshPayload).id),
                    user: { id: Number(token?.payload?.sub) },
                },
            })
            return refreshToken === null
        } catch {
            logger.error('Error while getting the refresh token', {
                id: (token?.payload as IRefreshPayload).id,
            })
        }

        return true
    },
})
