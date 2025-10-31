import { NextFunction, Response } from 'express'
import { TenantService } from '../services/TenantService'
import { TenantUserRequest } from '../types'
import { Logger } from 'winston'
export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async Tenant(req: TenantUserRequest, res: Response, next: NextFunction) {
        const { name, address } = req.body
        this.logger.debug('Request for creating a tenant', req.body)
        try {
            const tenant = await this.tenantService.create({ name, address })
            this.logger.info('Tenant has been created', { id: tenant.id })
            res.status(201).json({ id: tenant.id })
        } catch (error) {
            next(error)
        }
    }
}
