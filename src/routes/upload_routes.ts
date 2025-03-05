import {FastifyInstance, FastifyReply} from "fastify";
import fastifyMultipart, {Multipart, MultipartValue} from '@fastify/multipart';
import * as fs from "node:fs";
import path from "node:path";
import {supabase} from "../global/supabase_client";

// declare module 'fastify' {
//     interface FastifyReply {
//         /**
//          * Decorated reply function.
//          * @param filePath
//          */
//         sendFile: (filePath: string) => FastifyReply;
//     }
// }


export default async function uploadRoutes(fastify: FastifyInstance, options: any) {
    // Register fastify-multipart if not registered globally.
    fastify.register(fastifyMultipart);

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
     * Decorate the reply object with a sendFile helper.
     */
    // fastify.decorateReply('sendFile', function (this: FastifyReply, filePath: string) {
    //     console.log(`Sending file: ${filePath}`);
    //     const bufferFile = fs.readFileSync(filePath);
    //     // const stream = fs.createReadStream(filePath);
    //     // stream.on('error', (err: any) => {
    //     //     this.code(404).send('File not found');
    //     // });
    //     return this.send(bufferFile);
    // });

    /**
     * Route to serve the default site's index.html.
     * This system would have default sites used across documentations, and sites that are uploaded by users.
     * This must be in combination with the /default-sites/:site/* route below, so that both HTML and other assets can be sent.
     */
    fastify.get('/default-sites/:site/', async (request, reply) => {
        const { site } = request.params as { site: string };
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
    fastify.get('/default-sites/:site/*', async (request, reply) => {
        const { site } = request.params as { site: string };
        // The wildcard parameter is available as a property named '*' in request.params.
        const filename = (request.params as any)['*'];
        const sitePath = path.join(process.cwd(), './default-sites', site);
        if (!fs.existsSync(sitePath) || !fs.lstatSync(sitePath).isDirectory()) {
            reply.code(400).send({ message: 'No default site found' });
            return;
        }
        return reply.sendFile(filename, sitePath);
    });

    /**
     * POST route to handle webpage note uploads.
     */
    fastify.post('/webpage-note', async (request, reply) => {
        // Use the multipart iterator to process both file parts and form fields.
        const parts = request.parts();
        let filePart: Multipart | undefined;
        let imagePart: Multipart | undefined;
        const fields: Record<string, string> = {};

        for await (const part of parts) {
            if (part.type == 'file') {
                if (part.fieldname === 'file') {
                    filePart = part;
                } else if (part.fieldname === 'image') {
                    imagePart = part;
                }
            } else {
                console.log('???')
                // Capture non-file fields.
                console.log(part);
                // fields[part.fieldname] = part.value;
            }
        }

        // // Validate that the main file was provided.
        // if (!filePart) {
        //     reply.code(400).send({ message: '請上傳檔案。' });
        //     return;
        // }
        // if (!filePart.filename || filePart.filename === '') {
        //     reply.code(400).send({ message: '沒有選擇檔案。' });
        //     return;
        // }
        // if (!allowedFile(filePart.filename, ge.ALLOWED_COMPRESSION_EXTENSIONS)) {
        //     reply.code(400).send({ message: '不允許的檔案格式。' });
        //     return;
        // }
        //
        // // Get additional form data.
        // const title = fields['title'] || '';
        // const desc = fields['desc'] || '';
        // if (!title || !desc) {
        //     reply.code(400).send({ message: '請填完標題與描述。' });
        //     return;
        // }
        //
        // // Retrieve upload paths from environment variables or use defaults.
        // const uploadsSavePath = process.env.USER_WEBPAGE_NOTE_UPLOAD_SAVE_PATH || './uploads';
        // const uploadsBackupPath = process.env.USER_UPLOAD_BACKUP_PATH || './backup';
        //
        // fs.mkdirSync(uploadsSavePath, { recursive: true });
        // fs.mkdirSync(uploadsBackupPath, { recursive: true });
        //
        // // Create a unique timestamp string.
        // const timestamp = dayjs().format('YYYYMMDDHHmmssSSS');
        // const uploadTimestampBackupPath = path.join(uploadsBackupPath, timestamp);
        // fs.mkdirSync(uploadTimestampBackupPath, { recursive: true });
        //
        // // Handle image upload if provided.
        // if (imagePart && imagePart.filename && imagePart.filename !== '') {
        //     if (!allowedFile(imagePart.filename, ge.ALLOWED_IMAGE_EXTENSIONS)) {
        //         reply.code(400).send({ message: '不允許的圖片格式。' });
        //         return;
        //     }
        //     const imageFilename = sanitize(imagePart.filename);
        //     const imageBakPath = path.join(uploadTimestampBackupPath, imageFilename);
        //     await pumpPromise(imagePart.file, fs.createWriteStream(imageBakPath));
        // }
        //
        // // Backup the compressed file.
        // const filenameSecured = sanitize(filePart.filename);
        // const backupFilePath = path.join(uploadTimestampBackupPath, filenameSecured);
        // await pumpPromise(filePart.file, fs.createWriteStream(backupFilePath));
        //
        // // If the user is authenticated as a GitHub user.
        // if (request.user && request.user.github_login) {
        //     try {
        //         const userData = await uu.getUserFromTableByGithubId(request.user.github_id);
        //         const userFromTable = userData.data[0];
        //         await supabase
        //             .from('dilab_user_upload_notes')
        //             .insert({
        //                 owner_acc_type: 'github',
        //                 owner_id: userFromTable.id,
        //                 owner_name: userFromTable.github_username,
        //                 title: title,
        //                 description: desc,
        //                 directory: timestamp
        //             });
        //     } catch (e) {
        //         console.error('Unexpected error:', e);
        //         reply.code(400).send({ message: '儲存失敗' });
        //         return;
        //     }
        // }

        reply.send({ message: '檔案上傳成功！' });
    });
}
