// src/app.ts - Express App Setup

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health Check Route
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'TransitOps Backend' });
});

// Register ERP API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Exception:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred on the server.'
    });
});

export default app;
