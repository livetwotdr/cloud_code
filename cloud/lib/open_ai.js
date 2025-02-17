const config = require('../config');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: config.oa_api_key,
});

async function checkImage(imageUrl) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Describe this image in single word: nudity, explicit, pornographic, adult_content, sexual, sexy, no_face, if nothing above then return good or pending if you are not sure" },
                        {
                            type: "image_url",
                            image_url: { "url": imageUrl },
                        },
                    ],
                },
            ],
        });

        const description = response.choices[0].message.content;
        return description;
    } catch (error) {
        console.error("Error checking image: ", error);
        throw new Error("Image check failed");
    }
}

function isAdultContent(description) {
    const adultKeywords = ['nudity', 'explicit', 'pornographic', 'adult_content', 'sexual'];
    return adultKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function isSexyContent(description) {
    const sexyKeywords = ['sexy'];
    return sexyKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function isFaceNotDetected(description) {
    const noFaceKeywords = ['no_face'];
    return noFaceKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function isPending(description) {
    const pendingKeywords = ['pending'];
    return pendingKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function isGood(description) {
    const goodKeywords = ['good'];
    return goodKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

const openAiUtils = {
    checkImage,
    isAdultContent,
    isSexyContent,
    isFaceNotDetected,
    isPending,
    isGood
}

module.exports = openAiUtils;