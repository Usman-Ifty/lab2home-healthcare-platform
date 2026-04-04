/**
 * Creates and returns a pre-configured Express app instance
 * with the specified route module mounted at the given base path.
 */
import express, { Express } from 'express';

export const createTestApp = (routeModule: any, basePath: string): Express => {
    const app = express();
    app.use(express.json());
    app.use(basePath, routeModule);
    return app;
};
