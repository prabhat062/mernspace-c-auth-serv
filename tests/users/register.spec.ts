import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import { truncateTables } from '../utils'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await truncateTables(connection)
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
                password: 'secret',
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
                password: 'secret',
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
                password: 'secret',
            }
            //Act
            await request(app).post('/auth/register').send(userData)

            const userRepository = connection.getRepository('User')
            const users = await userRepository.find()
            //Assert
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })
    })

    describe('Given all fields', () => {})
})
