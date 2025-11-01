import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import { Tenant } from '../../src/entity/Tenant'
import createJWKSMock from 'mock-jwks'
import { Roles } from '../../src/constants'

describe('POST /tenants', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let adminToken: string

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5555')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(async () => {
        await connection.dropDatabase()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return 201 status code', async () => {
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_adress',
            }

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(201)
        })

        it('should create tenant in database', async () => {
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_adress',
            }

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(tenantData)
            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
            expect(tenants[0]).toHaveProperty('id')
            expect(tenants[0].name).toBe(tenantData.name)
            expect(tenants[0].address).toBe(tenantData.address)
        })

        it('should return 401 if user is not authenticated', async () => {
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_adress',
            }

            const response = await request(app)
                .post('/tenants')
                .send(tenantData)

            expect(response.statusCode).toBe(401)
            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
        })

        it('should return 403 if user is not authorized to create tenant', async () => {
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_adress',
            }

            const managerToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${managerToken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(403)
            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
        })
    })
})
