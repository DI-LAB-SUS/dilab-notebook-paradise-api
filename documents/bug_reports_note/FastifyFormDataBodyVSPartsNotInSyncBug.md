## Issue Sent to fastify-multipart Repo

Link to the issue: https://github.com/fastify/fastify-multipart/issues/569

## MRE (Minimal Reproducible Example) Repo

Link to the MRE: https://github.com/TempleLin/fastifymultipart-formdata-parts-notsync-issue.git

## Description

This is my frontend:

```js
import {useState, ChangeEvent} from 'react';
import {Container, Box, TextField, Button, Typography, Alert} from '@mui/material';
import {motion} from 'framer-motion';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {useIframeStore} from "../stores/iframe-store.ts";

// Common style for upload areas
const uploadBoxStyle = {
    border: '2px dashed #ccc',
    borderRadius: 2,
    p: 2,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    '&:hover': {borderColor: 'primary.main'},
};

const UploadRoute = () => {
    const [file, setFile] = useState<File | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [desc, setDesc] = useState<string>('');
    const [alert, setAlert] = useState('');
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

    const {setIFrameOpts} = useIframeStore();

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleDescChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= 100) {
            setDesc(e.target.value);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedImage = e.target.files[0];
            setImage(selectedImage);
            setImagePreview(URL.createObjectURL(selectedImage));
        }
    };

    const uploadFile = async () => {
        if (!file) {
            setAlert('請上傳檔案。');
            return;
        }
        if (title.length <= 0 || desc.length <= 0) {
            setAlert('請填完標題與描述。');
            return;
        }

        const formData = new FormData();
        formData.append('files[]', file);
        if (image) {
            formData.append('files[]', image);
        }
        formData.append('title', title);
        formData.append('desc', desc);

        try {
            const response = await fetch(`/api/upload/webpage-note`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const result = await response.json();

            setIsSuccess(response.status == 200);
            setAlert(result.message);

            if (response.status == 200) {
                setImage(null);
                setFile(null);
                setTitle('');
                setDesc('');
                setImagePreview('');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 50}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0}}
            transition={{duration: 0.5}}
        >
            <Container maxWidth="sm" sx={{mt: 8}}>
                {
                    isSuccess != null && (
                        <Alert variant="filled" severity={isSuccess ? "success" : "error"}>
                            {alert}
                        </Alert>
                    )
                }
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    上傳壓縮筆記
                </Typography>
                <Box position="relative" display="flex" justifyContent="flex-end" alignItems="center" width="100%" className={'mb-2'}>
                    {/* Centered Typography (Absolute Positioning) */}
                    <Typography sx={{position: "absolute", left: "50%", transform: "translateX(-50%)"}}
                                className={'text-gray-400'}>
                        *目前僅限定上傳 HTML, CSS, JS 網站*
                    </Typography>

                    {/* Right-Aligned Typography */}
                    <Typography className={'text-blue-300 font-bold shadow-2xl cursor-pointer'}
                    onClick={() => {
                        setIFrameOpts({
                            open: true,
                            url: '/api/upload/default-sites/upload-webpage-tut'
                        })
                    }}>
                        <HelpOutlineIcon className={'align-bottom'} />上傳教學
                    </Typography>
                </Box>
                <Box
                    component="form"
                    noValidate
                    autoComplete="off"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <TextField
                        label="筆記標題"
                        variant="outlined"
                        value={title}
                        onChange={handleTitleChange}
                        fullWidth
                    />
                    <TextField
                        label="筆記描述（限定100字）"
                        variant="outlined"
                        value={desc}
                        onChange={handleDescChange}
                        fullWidth
                        multiline
                        rows={5}
                    />
                    <Box component="label" sx={uploadBoxStyle}>
                        {file ? (
                            <Typography variant="subtitle1">已選擇檔案: {file.name}</Typography>
                        ) : (
                            <Typography variant="subtitle1" color="textSecondary">
                                點擊此區域上傳檔案 (.zip)
                            </Typography>
                        )}
                        <input type="file" hidden accept=".zip" onChange={handleFileChange}/>
                    </Box>

                    <Box
                        component="label"
                        sx={uploadBoxStyle}
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="預覽圖片"
                                style={{width: '100%', maxHeight: '300px', objectFit: 'contain'}}
                            />
                        ) : (
                            <Typography variant="subtitle1" color="textSecondary">
                                點擊此區域上傳筆記縮圖 (可不選)
                            </Typography>
                        )}
                        <input type="file" hidden accept="image/*" onChange={handleImageChange}/>
                    </Box>

                    <Button variant="contained" color="secondary" onClick={uploadFile}>
                        上傳
                    </Button>
                </Box>
            </Container>
        </motion.div>
    );
};

export default UploadRoute;

```

---

If I use attachFieldsToBody, everything works perfectly:

```js
fastify.register(fastifyMultipart , {  // Register fastify-multipart for parsing form data.
    limits: {
        fieldNameSize: 100,
        fieldSize: 1000000000000000,
        fields: 10,
        fileSize: 10000000000000,
        files: 5,
        headerPairs: 2000,
        parts: 1000
    },
    attachFieldsToBody: true
});

fastify.post('/webpage-note', async (request, reply) => {
    const formData = await request.formData();
    console.log(formData);
})
```

Log output:
```
FormData {
  'files[]': [
    File {
      size: 239122327,
      type: 'application/x-zip-compressed',
      name: 'myfile.zip',
      lastModified: 1741154824176
    },
    File {
      size: 30925,
      type: 'image/jpeg',
      name: '360_F_562234183_Pj8boZA8AR3USA0ZA6JvSbxvEXjvh4PB.jpg',
      lastModified: 1741154824177
    }
  ],
  title: '12341432',
  desc: 'safdsafdfads'
}
```

---

But if I use the traditional .parts() approach, the fields' values won't show, and only one file will appear:

```js
fastify.register(fastifyMultipart , {  // Register fastify-multipart for parsing form data.
    limits: {
        fieldNameSize: 100, // Max field name size in bytes
        fieldSize: 1000000000000000,     // Max field value size in bytes
        fields: 10,         // Max number of non-file fields
        fileSize: 10000000000000,  // For multipart forms, the max file size in bytes
        files: 5,           // Max number of file fields
        headerPairs: 2000,  // Max number of header key=>value pairs
        parts: 1000         // For multipart forms, the max number of parts (fields + files)
    },
    // attachFieldsToBody: true
});

fastify.post('/webpage-note', async (request, reply) => {
    // const formData = await request.formData();
    // console.log(formData);
    const parts = request.parts()
    for await (const part of parts) {
        console.log(part);
        if (part.type === 'file') {
            pipeline(part.file, fs.createWriteStream(part.filename))
        } else {
            // part.type === 'field
            console.log(part)
        }
    }
})
```

Log output:

```
<ref *1> {
  type: 'file',
  fieldname: 'files[]',
  filename: 'ml5-library-0.12.2.zip',
  encoding: '7bit',
  mimetype: 'application/x-zip-compressed',
  file: FileStream {
    _events: {
      close: undefined,
      error: undefined,
      data: undefined,
      end: [Function (anonymous)],
      readable: undefined,
      limit: [Function (anonymous)]
    },
    _readableState: ReadableState {
      highWaterMark: 16384,
      buffer: [Array],
      bufferIndex: 0,
      length: 64409,
      pipes: [],
      awaitDrainWriters: null,
      [Symbol(kState)]: 1052940
    },
    _maxListeners: undefined,
    bytesRead: 64409,
    truncated: false,
    _eventsCount: 2,
    _read: [Function (anonymous)],
    [Symbol(shapeMode)]: true,
    [Symbol(kCapture)]: false
  },
  fields: { 'files[]': [Circular *1] },
  _buf: null,
  toBuffer: [AsyncFunction: toBuffer]
}
```

---

When using {attachFieldsToBody: true}, everything is received. But when using .parts(), only the zip file is received,
while the image and all the text fields' values are missing.
