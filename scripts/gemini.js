import { GoogleGenAI } from "@google/genai";

// UI Elements
const generateBtn = document.getElementById('generate-btn');
const statusText = document.getElementById('status-text');
const sampleImg = document.getElementById('sample-image');
const videoPlaceholder = document.getElementById('video-placeholder');
const resultVideo = document.getElementById('result-video');
const spinner = document.getElementById('spinner');
const placeholderText = document.getElementById('placeholder-text');

// Helper for API Key
const checkApiKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        return await window.aistudio.hasSelectedApiKey();
    }
    // Fallback for non-AI Studio environments if needed, though strictly we rely on injection
    // In vanilla JS without bundler, process.env is usually undefined unless we define it.
    // We will assume window.aistudio is the primary path or process.env.API_KEY is available globally.
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY);
};

const promptApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
    } else {
        alert("Entorno AI Studio no detectado o API Key no configurada.");
    }
};

const getBase64Image = async (imgUrl) => {
    const response = await fetch(imgUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const generateVideo = async () => {
    try {
        let hasKey = await checkApiKey();
        if (!hasKey) {
            await promptApiKey();
            hasKey = await checkApiKey();
            if (!hasKey) return;
        }

        // Set UI to loading state
        generateBtn.disabled = true;
        generateBtn.textContent = "Procesando...";
        spinner.classList.remove('hidden');
        placeholderText.textContent = "Renderizando texturas y luz...";
        statusText.textContent = "Inicializando modelo Veo...";
        resultVideo.classList.add('hidden');
        videoPlaceholder.classList.remove('hidden');

        // Get Image
        const base64Image = await getBase64Image(sampleImg.src);
        const cleanBase64 = base64Image.split(',')[1] || base64Image;

        // Initialize API
        // Try to get key from process.env if it exists, otherwise assume implicit auth or aistudio handle
        const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : 'AI_STUDIO_KEY';
        
        // Note: In some AI Studio preview environments, we might need to fetch the key explicitly if not injected.
        // Assuming the standard pattern provided in the prompt:
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = "Cinematic slow pan of a handcrafted wooden cabinet, golden hour lighting, dust motes dancing in light, photorealistic, 4k, elegant atmosphere.";
        
        statusText.textContent = "Generando video (esto puede tardar unos minutos)...";

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/jpeg',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No se obtuvo URI del video.");

        // Update UI with result
        const finalUrl = `${videoUri}&key=${apiKey}`;
        resultVideo.src = finalUrl;
        resultVideo.classList.remove('hidden');
        videoPlaceholder.classList.add('hidden');
        statusText.textContent = "¡Video generado con éxito!";

    } catch (error) {
        console.error(error);
        statusText.textContent = "Error: " + (error.message || "Fallo en la generación");
        placeholderText.textContent = "Error en la generación.";
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generar Video con IA";
        spinner.classList.add('hidden');
    }
};

if (generateBtn) {
    generateBtn.addEventListener('click', generateVideo);
}

// Initial key check on load
checkApiKey();