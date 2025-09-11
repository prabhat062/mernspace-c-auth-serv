import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            //Assert
            expect(response.statusCode).toBe(201)
        })

        it('should return valid json', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            //Assert
            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            )
        })

        it('should persist the user in database', async () => {
            //Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'Prabhat1284@gmail.com',
                password: 'Password@12',
            }
            //Act
            await request(app).post('/auth/register').send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            //Assert
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it('should return an id of the created user', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.body).toHaveProperty('id')
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            )
        })

        it('should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe('customer')
        })

        it('should stored the hashed password in db', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2[a|b]\$\d+\$/)
        })

        it('should return 400 status code if email already exists', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()
            // Assert
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return access key and refresh key in cookies', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const rawCookies = response.headers['set-cookie']
            const cookies: string[] = Array.isArray(rawCookies)
                ? rawCookies
                : rawCookies
                  ? [rawCookies]
                  : []

            let accessToken: string | null = null
            let refreshToken: string | null = null

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }
            })

            cookies.forEach((cookie) => {
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()
            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it('should store the refresh token in db', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken)

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId=:userId', {
                    userId: response.body.id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('Fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: '',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
            expect(response.body.errors).toBeInstanceOf(Array)
        })

        it('should return 400 status code if firstName field is missing', async () => {
            // Arrange
            const userData = {
                firstName: '',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if lastName field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: '',
                email: 'prabhat1284@gmail.com',
                password: 'Password@12',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })

    describe('Fields are not in proper format', () => {
        it('should trim the email fields', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: ' Prabhat1284@gmail.com ',
                password: 'Password@12',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0].email).toBe('Prabhat1284@gmail.com')
        })
        it('should return 400 status code if password is not in proper format', async () => {
            // Arrange
            const userData = {
                firstName: 'Prabhat',
                lastName: 'Mishra',
                email: 'prabhat1284@gmail.com',
                password: '1234aAbc',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })
})
