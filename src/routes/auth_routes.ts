import {FastifyInstance} from "fastify";

export default async function authRoutes(fastify: FastifyInstance, options: any) {
    fastify.get('/login/callback', async (request, reply) => {
        console.log(request.query);
        const { token } = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request
        );

        if (!token) {
            return reply.redirect(process.env.FRONT_APP_BASE_URL!);
        }
        return reply.redirect(process.env.FRONT_APP_BASE_URL!);
    });
}
