import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        notEmpty: { errorMessage: 'Email is required!' },
        trim: true,
        isEmail: { errorMessage: 'Email is not valid!' },
    },
    password: {
        notEmpty: { errorMessage: 'Password is required!' },
    },
})
