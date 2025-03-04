import '@fastify/oauth2';
import {FastifyRequest} from "fastify";

/**
 * For providing typing context of the manually registered members into the Fastify Instance.
 */
declare module 'fastify' {
    interface FastifyInstance {
        githubOAuth2: {
            generateAuthorizationUri: () => string;
            getAccessTokenFromAuthorizationCodeFlow: (FastifyRequest) => any;
        },
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
