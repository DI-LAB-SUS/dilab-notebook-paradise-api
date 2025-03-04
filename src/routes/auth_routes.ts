import fastify, {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {cacheUser, generateUserJWT, getGitHubUserFromTable, getUserFromCache} from "../utils/auth_utils";
import dotenv from "dotenv";

dotenv.config();

export default async function authRoutes(fastify: FastifyInstance, options: any) {
    fastify.get('/login/github-callback', async (request, reply) => {
        const FRONT_APP_BASE_URL = process.env.FRONT_APP_BASE_URL!;
        const JWT_EXP_DELTA_SECONDS = Number(process.env.JWT_EXP_DELTA_SECONDS!);

        const { token } = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request
        );

        if (!token) {
            return reply.redirect(FRONT_APP_BASE_URL);
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
            const userGitHubId = userData.id;
            const userGitHubName = userData.login;

            console.log(`User GitHub ID: ${userGitHubId}, Username: ${userGitHubName}`);

            const userFromDB = await getGitHubUserFromTable(userGitHubId);

            if (!userFromDB) {
                let target_url = FRONT_APP_BASE_URL;
                if (target_url.endsWith('/')) {
                    target_url = target_url.slice(0, -1);
                }
                return reply.redirect(`${target_url}/githubauth-usernotallowed?username=${userGitHubName}`)
            }

            console.log(`User by GitHub ID: ${userGitHubId} is ID ${userFromDB.id} in database.`)

            const jwtToken = generateUserJWT(fastify, {id: userFromDB.id});

            await cacheUser(fastify, userFromDB, JWT_EXP_DELTA_SECONDS);

            return reply
                .setCookie('token', jwtToken, {
                    httpOnly: true, // Not accessible via JavaScript.
                    secure: true, // Only send over HTTPS (in production).
                    sameSite: 'lax', // Adjust based on your cross-site needs.
                    maxAge: JWT_EXP_DELTA_SECONDS, // Expiration time in seconds.
                    path: '/' // Ensures that the cookie is included in all requests sent to the server, regardless of which endpoint is accessed.
                })
                .redirect(FRONT_APP_BASE_URL);
        } catch (error) {
            console.error("Error fetching GitHub user data:", error);
            return reply.redirect(process.env.FRONT_APP_BASE_URL!);
        }
    });

    fastify.get('/user', { preValidation: [fastify.authenticate] }, async function(request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const userFromDB = await getUserFromCache(fastify, (request.user as any).user_id);
        if (!userFromDB) {
            return reply.status(400).send({ error: "User missing in system." });
        }

        console.log(`User: ${JSON.stringify(userFromDB)}`);

        if (userFromDB.github_id) {
            return {
                "github_username": userFromDB.github_username,
            }
        }

        /*
        TODO More types of return in the future when there are more types of OAuth2 or default login.
         */
        return {
            "id": userFromDB.id
        }
    });
}
