import app from './app'
import { Config } from './config'
import { AppDataSource } from './config/data-source'
import logger from './config/logger'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected succcessfully')
        app.listen(PORT, () => {
            logger.info('Server Listening on Port', { port: PORT })
        })
    } catch (error) {
        logger.error('Error starting server', { error })
        process.exit(1)
    }
}

startServer().catch((error: unknown) => {
    logger.error('Unhandled error in startServer', { error })
    process.exit(1)
})
