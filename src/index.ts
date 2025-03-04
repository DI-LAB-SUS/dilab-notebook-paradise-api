import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJWT from '@fastify/jwt';
import authRoutes from './routes/auth_routes';
import dotenv from 'dotenv';
import {fastifyOauth2} from "@fastify/oauth2";
import fastifyCors from "@fastify/cors";

dotenv.config(); // Load environment variables from .env file.

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

const fastify = Fastify({
    // logger: true
});

fastify.register(fastifyCookie); // Register Cookie Plugin

/**
 * This application uses HttpOnly Cookies for JWT authentication. Therefore, CORs need to be extra explicitly set like this.
 */
fastify.register(fastifyCors, {
    origin: process.env.FRONT_APP_BASE_URL!,
    credentials: true,
});

fastify.register(fastifyJWT, { // Register JWT Plugin
    secret: JWT_SECRET_KEY as string,
    sign: {
        algorithm: JWT_ALGORITHM as any,
    },
    verify: {
        algorithms: [JWT_ALGORITHM as any]
    }
});

fastify.register(fastifyOauth2, {
    name: 'githubOAuth2',
    scope: ['profile', 'email'],
    credentials: {
        client: {
            id: process.env.GITHUB_CLIENT_ID!,
            secret: process.env.GITHUB_CLIENT_SECRET!,
        },
        auth: fastifyOauth2.GITHUB_CONFIGURATION,
    },
    startRedirectPath: '/auth/login/github',
    callbackUri: process.env.GITHUB_CALLBACK_URI!,
    // The documentation says the default `path` is / , but it's not actually ~
    cookie: {
        path: "/",
    }
});

fastify.register(authRoutes, {prefix: '/auth'});


fastify.get('/hello-world', async (request, reply) => {
    return 'Hello, world!';
});

// Protected Route Example
fastify.get('/protected', async (request, reply) => {
    if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    return { message: 'Access granted', user: request.user };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        console.log('Server running at http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
