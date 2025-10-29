// import { DataSource } from 'typeorm'
// import app from '../../src/app'
// import request from 'supertest'
// import { AppDataSource } from '../../src/config/data-source'
// import createJWKSMock from 'mock-jwks'
// import { User } from '../../src/entity/User'
// import { Roles } from '../../src/constants'

// describe('GET /auth/self', () => {
//     let connection: DataSource
//     let jwks: ReturnType<typeof createJWKSMock>
//     let stopJwks: void

//     beforeAll(async () => {
//         jwks = createJWKSMock('http://localhost:5555')
//         connection = await AppDataSource.initialize()
//     })

//     beforeEach(async () => {
//         jwks.start()
//         await connection.dropDatabase()
//         await connection.synchronize()
//     })

//     afterEach(() => {
//         jwks.stop()
//     })

//     afterAll(async () => {
//         await connection.destroy()
//     })

//     describe('Given all fields', () => {
//         it('should return the 200 status code', async () => {
//             //Act
//             const accessToken = jwks.token({
//                 sub: '1',
//                 role: Roles.CUSTOMER,
//             })
//             const response = await request(app)
//                 .get('/auth/self')
//                 .set('Cookie', [`accessToken=${accessToken}`])
//                 .send()
//             //Assert
//             expect(response.statusCode).toBe(200)
//         })

//         it('should return userData', async () => {
//             //Arrange
//             const userData = {
//                 firstName: 'Prabhat',
//                 lastName: 'Mishra',
//                 email: 'Prabhat1284@gmail.com',
//                 password: 'Password@12',
//             }
//             //Act
//             const userRepository = connection.getRepository(User)
//             const data = await userRepository.save({
//                 ...userData,
//                 role: Roles.CUSTOMER,
//             })
//             const accessToken = jwks.token({
//                 sub: String(data.id),
//                 role: data.role,
//             })
//             const response = await request(app)
//                 .get('/auth/self')
//                 .set('Cookie', [`accessToken=${accessToken};`])
//                 .send()
//             //Assert
//             expect(response.body.id).toBe(data.id)
//         })

//         it('should not written the password field', async () => {
//             //Arrange
//             const userData = {
//                 firstName: 'Prabhat',
//                 lastName: 'Mishra',
//                 email: 'Prabhat1284@gmail.com',
//                 password: 'Password@12',
//             }
//             //Act
//             const userRepository = connection.getRepository(User)
//             const data = await userRepository.save({
//                 ...userData,
//                 role: Roles.CUSTOMER,
//             })
//             const accessToken = jwks.token({
//                 sub: String(data.id),
//                 role: data.role,
//             })
//             const response = await request(app)
//                 .get('/auth/self')
//                 .set('Cookie', [`accessToken=${accessToken};`])
//                 .send()
//             //Assert
//             expect(response.body as Record<string, string>).not.toHaveProperty(
//                 'password',
//             )
//         })

//         it('should return 401 status code if token does not exists', async () => {
//             //Arrange
//             const userData = {
//                 firstName: 'Prabhat',
//                 lastName: 'Mishra',
//                 email: 'Prabhat1284@gmail.com',
//                 password: 'Password@12',
//             }
//             //Act

//             const response = await request(app).get('/auth/self').send()
//             //Assert
//             expect(response.statusCode).toBe(401)
//         })
//     })
// })
import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

describe('GET /auth/self', () => {
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

    describe('Authenticated user scenarios', () => {
        it('should return 200 when valid token is provided', async () => {
            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat@example.com',
                password: 'Password@12',
                role: Roles.CUSTOMER,
            })

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])

            expect(response.statusCode).toBe(200)
        })

        it('should return authenticated user details', async () => {
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

        it('should not include password in response', async () => {
            const repo = connection.getRepository(User)
            const saved = await repo.save({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@doe.com',
                password: 'Password@12',
                role: Roles.CUSTOMER,
            })

            const token = jwks.token({
                sub: String(saved.id),
                role: saved.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.body).not.toHaveProperty('password')
        })

        it('should only include safe fields in response', async () => {
            const repo = connection.getRepository(User)
            const saved = await repo.save({
                firstName: 'A',
                lastName: 'B',
                email: 'a@b.com',
                password: 'Xyz123@',
                role: Roles.CUSTOMER,
            })

            const token = jwks.token({
                sub: String(saved.id),
                role: saved.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token}`])

            expect(Object.keys(response.body)).toEqual(
                expect.arrayContaining([
                    'id',
                    'firstName',
                    'lastName',
                    'email',
                    'role',
                ]),
            )
            expect(response.body).not.toHaveProperty('password')
        })
    })

    describe('Error and edge cases', () => {
        it('should return 401 when token is missing', async () => {
            const response = await request(app).get('/auth/self').send()
            expect(response.statusCode).toBe(401)
        })

        it('should return 401 for invalid token', async () => {
            const invalidToken = 'fake.jwt.token'
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${invalidToken}`])
            expect(response.statusCode).toBe(401)
        })

        it('should return 401 for expired token', async () => {
            const expiredToken = jwks.token({
                sub: '1',
                exp: Math.floor(Date.now() / 1000) - 60, // expired 1 min ago
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${expiredToken}`])

            expect(response.statusCode).toBe(401)
        })

        it('should return 404 when user does not exist', async () => {
            const accessToken = jwks.token({
                sub: '999',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])

            expect(response.statusCode).toBe(404)
        })
    })
})
