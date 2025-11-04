import express, { Request, Response, NextFunction } from 'express'
import { AppDataSource } from '../config/data-source'
import logger from '../config/logger'
import authenticate from '../middlewares/authenticate'
import { Roles } from '../constants'
import { canAccess } from '../middlewares/canAccess'
import { UserController } from '../controllers/UserController'
import { User } from '../entity/User'
import { UserService } from '../services/UserService'
import createUserValidator from '../validators/create-user-validator'
import updateUserValidator from '../validators/update-user-validator'
import { UpdateUserRequest } from '../types'
const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService, logger)
router.post(
    '/',
    authenticate,
    createUserValidator,
    canAccess([Roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.create(req, res, next),
)

router.patch(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    (req: UpdateUserRequest, res: Response, next: NextFunction) =>
        userController.update(req, res, next),
)

router.get('/', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    userController.getAll(req, res, next),
)

router.get('/:id', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    userController.getOne(req, res, next),
)

router.delete(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    (req, res, next) => userController.destroy(req, res, next),
)

export default router
