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
            // You can add other methods or properties provided by the plugin as needed.
        }
    }
}
