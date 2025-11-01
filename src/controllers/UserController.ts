import { NextFunction, Response } from 'express'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { CreateUserRequest } from '../types'
import { Roles } from '../constants'

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}
    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const { firstName, lastName, email, password } = req.body
        this.logger.debug('Request for creating a user', req.body)
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role: Roles.MANAGER,
            })
            this.logger.info('user has been created', { id: user.id })
            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
        }
    }
}
