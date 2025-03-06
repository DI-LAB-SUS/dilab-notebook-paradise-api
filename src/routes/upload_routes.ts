import {FastifyInstance, FastifyReply} from "fastify";
import fastifyMultipart, {Multipart, MultipartValue} from '@fastify/multipart';
import * as fs from "node:fs";
import path from "node:path";
import {supabase} from "../global/supabase_client";
import util from 'util';
import dayjs from "dayjs";
import sanitizeFilename from 'sanitize-filename';
import {pipeline} from 'stream';
import {PipelineSource, Readable} from "node:stream";
import {getUserFromCache} from "../utils/auth_utils";
import unzipper from 'unzipper';


const ALLOWED_COMPRESSION_EXTENSIONS = ['zip'];
const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif'];

const pipelineAsync = util.promisify(pipeline);

export default async function uploadRoutes(fastify: FastifyInstance, options: any) {
    /**
     * Helper function to check allowed file extensions.
     * @param filename
     * @param allowedExts
     */
    function allowedFile(filename: string, allowedExts: string[]): boolean {
        if (!filename) return false;
        const parts = filename.split('.');
        if (parts.length < 2) return false;
        const ext = parts.pop()?.toLowerCase();
        return ext ? allowedExts.includes(ext) : false;
    }

    /**
     * Route to serve the default site's index.html.
     * This system would have default sites used across documentations, and sites that are uploaded by users.
     * This must be in combination with the /default-sites/:site/* route below, so that both HTML and other assets can be sent.
     */
    fastify.get('/default-sites/:site/', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        const {site} = request.params as { site: string };
        const filename = 'index.html';
        const sitePath = path.join(process.cwd(), './default-sites', site);
        if (!fs.existsSync(sitePath)) {
            reply.code(404).send('Default site not found');
            return;
        }
        return reply.sendFile(filename, sitePath);
    });

    /**
     * Route to serve static assets (CSS, JS, etc.) for a given default site.
     */
    fastify.get('/default-sites/:site/*', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        const {site} = request.params as { site: string };
        // The wildcard parameter is available as a property named '*' in request.params.
        const filename = (request.params as any)['*'];
        const sitePath = path.join(process.cwd(), './default-sites', site);
        if (!fs.existsSync(sitePath) || !fs.lstatSync(sitePath).isDirectory()) {
            reply.code(400).send({message: 'No default site found'});
            return;
        }
        return reply.sendFile(filename, sitePath);
    });

    /**
     * POST route to handle webpage note uploads.
     */
    fastify.post('/webpage-note', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        try {
            const formData = await request.formData();

            console.log(formData);

            const title = formData.get('title');
            const desc = formData.get('desc');
            const file = formData.get('file') as File | null;
            const image = formData.get('image') as File | null;

            console.log(file);
            console.log(image);

            if (!title || !desc) {
                reply.code(400).send({message: '請填完標題與描述。'});
                return;
            }
            if (!file) {
                reply.code(400).send({message: '請上傳檔案。'});
                return;
            }
            if (!file.name || file.name === '') {
                reply.code(400).send({message: '沒有選擇檔案。'});
                return;
            }
            if (!allowedFile(file.name, ALLOWED_COMPRESSION_EXTENSIONS)) {
                reply.code(400).send({message: '不允許的檔案格式。'});
                return;
            }

            console.log(`User uploaded new note: ${title}`);

            const USER_WEBPAGE_NOTE_UPLOAD_SAVE_PATH = process.env.USER_WEBPAGE_NOTE_UPLOAD_SAVE_PATH!;
            const USER_UPLOAD_BACKUP_PATH = process.env.USER_UPLOAD_BACKUP_PATH!;

            await fs.promises.mkdir(USER_WEBPAGE_NOTE_UPLOAD_SAVE_PATH, {recursive: true});
            await fs.promises.mkdir(USER_UPLOAD_BACKUP_PATH, {recursive: true});

            // Create a unique timestamp string.
            const timestamp = dayjs().format('YYYYMMDDHHmmssSSS');

            const uploadTimestampBackupPath = path.join(USER_UPLOAD_BACKUP_PATH, timestamp);
            await fs.promises.mkdir(uploadTimestampBackupPath, {recursive: true});

            const filenameSecured = sanitizeFilename(file.name);
            const backupFilePath = path.join(uploadTimestampBackupPath, filenameSecured);

            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // Backup the compressed file. Prevent saving massive data by using chunks through Pipeline.
            const backupFileStream = Readable.from(fileBuffer);
            await pipelineAsync(backupFileStream, fs.createWriteStream(backupFilePath));

            // Start saving & decompressing webpage into their main save path.
            const uploadTimestampSavePath = path.join(USER_WEBPAGE_NOTE_UPLOAD_SAVE_PATH, timestamp);
            const uploadWebPageSavePath = path.join(uploadTimestampSavePath, 'webpage');

            await fs.promises.mkdir(uploadTimestampSavePath, {recursive: true});
            await fs.promises.mkdir(uploadWebPageSavePath);

            await fs.createReadStream(backupFilePath)
                .pipe(unzipper.Extract({ path: uploadWebPageSavePath }))
                .promise();

            // Save and backup image as well if it exists.
            if (image) {
                const imgBuffer = Buffer.from(await image.arrayBuffer());

                const imageFilenameSecured = sanitizeFilename(image.name);
                const backupImgFilePath = path.join(uploadTimestampBackupPath, imageFilenameSecured);
                const backImgFileStream = Readable.from(imgBuffer);
                await pipelineAsync(backImgFileStream, fs.createWriteStream(backupImgFilePath));

                const uploadImageSaveDir = path.join(uploadTimestampSavePath, 'image');
                await fs.promises.mkdir(uploadImageSaveDir);
                const imgFileStream = Readable.from(imgBuffer); // Streams are one-shot, need to create another one.
                await pipelineAsync(imgFileStream, fs.createWriteStream(path.join(uploadImageSaveDir, imageFilenameSecured)));
            }

            const userFromDB = await getUserFromCache(fastify, (request.user as any).user_id);

            // Save upload metadata to database for GitHub users.
            if (userFromDB.github_id) {
                const result = await supabase.from('dilab_user_upload_notes')
                    .insert({
                        "owner_acc_type": "github",
                        "owner_id": userFromDB.github_id,
                        "owner_name": userFromDB.github_username,
                        "title": title,
                        "description": desc,
                        "directory": timestamp
                    })
                if (result.error) {
                    throw new Error(result.error.message);
                }
            }
        } catch (error) {
            console.error(error);
            reply.status(500).send({success: false, message: "Failed to upload."});
        }

        reply.send({message: '檔案上傳成功！'});
    });

    fastify.get('/webpage-notes-list', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        const result = await supabase
            .from('dilab_user_upload_notes')
            .select();

        reply.send(result);

        if (result.error) {
            reply.status(500).send({message: '筆記列表瀏覽失敗。'})
        }
    });
}
