import app from '../../src/app'
import request from 'supertest'

describe('POST /auth/register', () => {
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

        it('should persist data', async () => {
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
    })

    describe('Given all fields', () => {})
})
