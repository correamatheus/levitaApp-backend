import express from 'express';
import authRoutes from './routes/authRoutes.ts';
import userRoutes from './routes/userRoutes.ts';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { isTest } from '../env.ts';
const app = express();

app.use(helmet());
app.use(morgan('dev', {
    skip: () => isTest()
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timeStamp: new Date().toISOString(),
        service: 'Levita API'
    })
    .status(200);
})

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export {app};
export default app;