import { checkSchema } from 'express-validator'

export default checkSchema({
    name: {
        trim: true,
        isLength: {
            options: { max: 100 },
            errorMessage: 'Tenant name must be between 8 and 255 characters',
        },
        notEmpty: { errorMessage: 'Tenant name is required!' },
    },
    address: {
        trim: true,
        isLength: {
            options: { min: 8, max: 255 },
            errorMessage: 'Address must be between 8 and 255 characters',
        },
        notEmpty: { errorMessage: 'Address is required!' },
    },
})
