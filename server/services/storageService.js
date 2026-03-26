import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer, filename) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'pixlayer',
                public_id: filename.replace(/\.[^.]+$/, ''),
                resource_type: 'image',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        uploadStream.end(buffer);
    });
}

export async function uploadBase64Image(base64Data, filename) {
    const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'pixlayer',
        public_id: filename,
        resource_type: 'image',
    });
    return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId) {
    return cloudinary.uploader.destroy(publicId);
}
