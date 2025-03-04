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

        try {
            // Fetch user details from GitHub API
            const userResponse = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });

            if (!userResponse.ok) {
                throw new Error(`GitHub API responded with status: ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            console.log("GitHub User:", userData);

            // Extract user details
            const userId = userData.id;
            const username = userData.login;

            console.log(`User ID: ${userId}, Username: ${username}`);

            return reply.redirect(process.env.FRONT_APP_BASE_URL!);
        } catch (error) {
            console.error("Error fetching GitHub user data:", error);
            return reply.redirect(process.env.FRONT_APP_BASE_URL!);
        }
    });
}
