import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import createJWKSMock from 'mock-jwks'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

describe('GET /auth/self', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let stopJwks: void

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5555')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 200 status code', async () => {
            //Act
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()
            //Assert
            expect(response.statusCode).toBe(200)
        })

        it('should return userData', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act
            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()
            //Assert
            expect(response.body.id).toBe(data.id)
        })

        it('should not written the password field', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act
            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()
            //Assert
            expect(response.body as Record<string, string>).not.toHaveProperty(
                'password',
            )
        })

        it('should return 401 status code if token does not exists', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act

            const response = await request(app).get('/auth/self').send()
            //Assert
            expect(response.statusCode).toBe(401)
        })
    })
})
