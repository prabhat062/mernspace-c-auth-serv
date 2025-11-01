import { Request } from 'express'

export interface UserData {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
}

export interface RegisterUserRequest extends Request {
    body: UserData
}

export interface AuthRequest extends Request {
    auth: {
        sub: string
        role: string
        id: string
    }
}

export interface IRefreshPayload {
    id: string
}

export interface ITenant {
    name: string
    address: string
}

export interface TenantUserRequest extends Request {
    body: ITenant
}

export interface CreateUserRequest extends Request {
    body: UserData
}
