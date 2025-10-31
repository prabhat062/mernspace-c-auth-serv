import express from 'express'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { TenantService } from '../services/TenantService'
import { TenantController } from '../controllers/TenantController'
import logger from '../config/logger'
const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)
router.post('/', (req, res, next) => tenantController.Tenant(req, res, next))

export default router
