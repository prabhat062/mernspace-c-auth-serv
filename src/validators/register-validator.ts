import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        notEmpty: { errorMessage: 'Email is required!' },
        trim: true,
        isEmail: { errorMessage: 'Email is not valid!' },
    },
    firstName: {
        notEmpty: { errorMessage: 'firstName is required!' },
    },
    lastName: {
        notEmpty: { errorMessage: 'lastName is required!' },
    },
    password: {
        isLength: {
            options: { min: 8, max: 32 },
            errorMessage: 'Password must be between 8 and 32 characters',
        },
        custom: {
            options: (value: string) => {
                if (!/[A-Z]/.test(value))
                    throw new Error('Must contain an uppercase letter')
                if (!/[a-z]/.test(value))
                    throw new Error('Must contain a lowercase letter')
                if (!/[0-9]/.test(value))
                    throw new Error('Must contain a number')
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
                    throw new Error('Must contain a special character')
                return true
            },
        },
    },
})
