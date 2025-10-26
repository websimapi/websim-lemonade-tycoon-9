export async function generateAsset(prompt, type) {
    if (!['shirt', 'pants', 'hair'].includes(type)) {
        throw new Error('Unsupported asset type for generation.');
    }

    // Construct a detailed prompt for generating a paper doll clothing item.
    const fullPrompt = `A ${prompt}, designed as a clothing item for a cartoon paper doll. The item is a ${type}. It should be rendered in a simple, flat illustration style, front view. The background must be transparent.`;

    try {
        const result = await websim.imageGen({
            prompt: fullPrompt,
            transparent: true,
            aspect_ratio: "square",
        });

        if (!result || !result.url) {
            throw new Error('Image generation failed to return a URL.');
        }

        console.log(`Generated ${type} asset:`, result.url);
        return result.url;

    } catch (error) {
        console.error('Error in generateAsset:', error);
        throw error; // Re-throw the error to be caught by the caller
    }
}