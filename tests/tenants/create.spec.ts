import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import { Tenant } from '../../src/entity/Tenant'

describe('POST /tenants', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
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
                .send(tenantData)
            console.log(response)

            expect(response.statusCode).toBe(201)
        })

        it('should create tenant in database', async () => {
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_adress',
            }

            const response = await request(app)
                .post('/tenants')
                .send(tenantData)
            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
            expect(tenants[0]).toHaveProperty('id')
            expect(tenants[0].name).toBe(tenantData.name)
            expect(tenants[0].address).toBe(tenantData.address)
        })
    })
})
