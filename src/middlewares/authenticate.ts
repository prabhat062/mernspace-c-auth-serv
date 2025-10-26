import { expressjwt, GetVerificationKey } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import { Config } from '../config'
import { Request } from 'express'

export default expressjwt({
    secret: jwksRsa.expressJwtSecret({
        jwksUri: Config.JWKS_URI!,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,

    algorithms: ['RS256'],

    getToken(req: Request) {
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.split(' ')[1] !== 'undefined') {
            const token = authHeader.split(' ')[1]
            if (token) return token
        }

        const { accessToken } =
            (req.cookies as { accessToken?: string } | undefined) ?? {}
        return accessToken
    },
})
