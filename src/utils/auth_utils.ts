import {FastifyInstance} from "fastify";
import fp from 'fastify-plugin';
import {supabase} from "../global/supabase_client";

export async function getGitHubUserFromTable(github_id: number) {
    const {data, error} = await supabase.from('dilab_github_users')
        .select()
        .eq('github_id', github_id)
        .limit(1);

    if (error) {
        console.error(error);
        return null;
    }

    if (data?.length == 0) {
        console.log(`User ${github_id} doesn't exist in table.`);
        return null;
    }

    return data[0];
}

/**
 *
 * @param fastify
 * @param user User ID in database.
 */
export function generateUserJWT(fastify: FastifyInstance, user: {id: number}) {
    return fastify.jwt.sign(
        { user_id: user.id }, // ID in database.
        { expiresIn: Number(process.env.JWT_EXP_DELTA_SECONDS) }
    );
}

/**
 * Cache user in memory for fast retrieval.
 * @param fastify
 * @param userFromDB User data fetched from the database.
 * @param expireSecs Seconds to expire.
 */
export async function cacheUser(fastify: FastifyInstance, userFromDB: any, expireSecs: number) {
    await fastify.redis.setex(
        `ID:${userFromDB.id}`,
        expireSecs,  // Expire in seconds.
        JSON.stringify(userFromDB),
    );
}

/**
 *
 * @param fastify
 * @param userID User ID in the database.
 */
export async function getUserFromCache(fastify: FastifyInstance, userID: number) {
    const userFromDB = await fastify.redis.get(`ID:${userID}`);
    if (!userFromDB) {
        return null;
    }

    return JSON.parse(userFromDB!);
}

export async function getUserByJWT(fastify: FastifyInstance, jwt: string) {
    return fastify.redis.get(
        `JWT:${jwt}`
    );
}

export async function getGitHubUser(fastify: FastifyInstance, accessToken: string) {
    const userId = await fastify.redis.get(`github_token:${accessToken}`);
    if (userId) {
        return fastify.redis.get(userId);
    }
}
