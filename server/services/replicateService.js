import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Grounded-SAM 2 — Text-prompted segmentation
 */
export async function groundedSam(imageUrl, textPrompt) {
    const output = await replicate.run(
        'idea-research/ram-grounded-sam:80a2aede4cf8e3c9f26571571d07057900da8af4f4f6e1e2ed60b0ed337e051d',
        {
            input: {
                image: imageUrl,
                text_prompt: textPrompt,
                task_type: 'seg',
                box_threshold: 0.25,
                text_threshold: 0.2,
            },
        }
    );
    return output;
}

/**
 * LaMa Inpainting — Fast cleanup
 */
export async function lamaInpaint(imageUrl, maskUrl) {
    const output = await replicate.run(
        'andreasjansson/stable-diffusion-inpainting:e490d072a34a94a11e9711ed5a6ba621c3fab884eda1665d9d3a282d65a21571',
        {
            input: {
                image: imageUrl,
                mask: maskUrl,
                prompt: 'clean background, seamless fill',
                num_inference_steps: 20,
                guidance_scale: 7.5,
            },
        }
    );
    return output;
}

/**
 * Stable Diffusion Inpainting — AI-generated fill
 */
export async function sdInpaint(imageUrl, maskUrl, prompt) {
    const output = await replicate.run(
        'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        {
            input: {
                image: imageUrl,
                mask: maskUrl,
                prompt: prompt,
                num_inference_steps: 30,
                guidance_scale: 7.5,
            },
        }
    );
    return output;
}
