import { DeepPartial, Repository } from 'typeorm'
import { User } from '../entity/User'
import { LimitedUserData, UserData } from '../types'
import createHttpError from 'http-errors'
import bcrypt from 'bcrypt'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })
        if (user) {
            const err = createHttpError(400, 'Email already exists!')
            throw err
        }
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const userData: DeepPartial<User> = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            ...(tenantId ? { tenant: { id: tenantId } } : {}),
        }
        try {
            return await this.userRepository.save(userData)
        } catch {
            const error = createHttpError(
                500,
                'Failed to store the data in db.',
            )
            throw error
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: {
                email,
            },
        })
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id,
            },
        })
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            })
        } catch {
            const error = createHttpError(
                500,
                'Failed to update the user in the database',
            )
            throw error
        }
    }

    async getAll() {
        return await this.userRepository.find()
    }

    async deleteById(userId: number) {
        return await this.userRepository.delete(userId)
    }
}
