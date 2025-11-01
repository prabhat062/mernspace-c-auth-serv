import express from 'express'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { TenantService } from '../services/TenantService'
import { TenantController } from '../controllers/TenantController'
import logger from '../config/logger'
import authenticate from '../middlewares/authenticate'
import { Roles } from '../constants'
import { canAccess } from '../middlewares/canAccess'
const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)
router.post('/', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    tenantController.Tenant(req, res, next),
)

export default router
