import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

describe('POST /users', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5555')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(async () => {
        jwks.stop()
        await connection.dropDatabase()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
                tenantId: 1,
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            expect(response.statusCode).toBe(201)
        })

        it('should persist user in database', async () => {
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
                tenantId: 1,
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()
            expect(users).toHaveLength(1)
        })

        it('should create role as Manager', async () => {
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
                tenantId: 1,
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()
            expect(users[0].role).toBe(Roles.MANAGER)
        })

        it.skip('should return 403 if non admin user tried to create a user', async () => {
            const userRepo = connection.getRepository(User)
            const user = await userRepo.save({
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
                role: Roles.CUSTOMER,
            })

            const token = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.statusCode).toBe(200)
            expect(response.body.id).toBe(user.id)
        })
    })
})
