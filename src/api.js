/**
 * Video AI API Integration
 * Supports: Demo Mode (free) + Replicate API via Vercel serverless
 */

// API URL - uses relative path (works for both local dev and Vercel)
const PROXY_URL = '/api';

// Demo videos for testing without API
const DEMO_VIDEOS = [
    {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        prompt: 'Fire and explosions'
    },
    {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        prompt: 'Sports car driving'
    },
    {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        prompt: 'Animated characters'
    },
    {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        prompt: 'Animated elephant dream'
    }
];

// Replicate models - use official model names (not version hashes)
// API will use: POST /v1/models/{owner}/{name}/predictions
const REPLICATE_MODELS = {
    'minimax': {
        name: 'Minimax Hailuo',
        owner: 'minimax',
        model: 'video-01',
        description: 'Hailuo AI - 6s video, chất lượng cao',
        inputFormat: (prompt) => ({
            prompt: prompt,
            prompt_optimizer: true
        })
    },
    'luma': {
        name: 'Luma Dream Machine',
        owner: 'luma',
        model: 'ray',
        description: 'Luma AI - Video chất lượng cinematic',
        inputFormat: (prompt) => ({
            prompt: prompt
        })
    },
    'kling': {
        name: 'Kling AI',
        owner: 'kwaivgi',
        model: 'kling-video',
        description: 'Kuaishou Kling - Video chi tiết cao',
        inputFormat: (prompt) => ({
            prompt: prompt,
            negative_prompt: 'blurry, low quality',
            cfg_scale: 0.5,
            duration: 5
        })
    }
};

/**
 * Generate video - Demo mode or Replicate API via proxy
 */
export async function generateVideo(prompt, options = {}) {
    const {
        model = 'minimax',
        aspectRatio = '16:9',
        token = null,
        onProgress = () => { }
    } = options;

    onProgress({ status: 'starting', message: 'Đang khởi tạo...', progress: 5 });

    // If no token, use demo mode
    if (!token || token.trim() === '') {
        return await generateDemoVideo(prompt, onProgress);
    }

    // Use Replicate API via proxy
    return await generateWithReplicate(prompt, model, aspectRatio, token, onProgress);
}

/**
 * Demo mode - simulates video generation with sample videos
 */
async function generateDemoVideo(prompt, onProgress) {
    onProgress({ status: 'demo', message: '🎬 Chế độ Demo - Đang tạo video mẫu...', progress: 20 });

    await delay(1000);
    onProgress({ status: 'processing', message: 'AI đang phân tích prompt...', progress: 40 });

    await delay(1500);
    onProgress({ status: 'generating', message: 'Đang tạo các frame...', progress: 60 });

    await delay(1500);
    onProgress({ status: 'rendering', message: 'Đang render video...', progress: 80 });

    await delay(1000);

    const randomVideo = DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)];

    onProgress({ status: 'complete', message: 'Hoàn thành! (Video mẫu)', progress: 100 });

    return {
        videoUrl: randomVideo.url,
        model: 'Demo Mode',
        prompt,
        isDemo: true
    };
}

/**
 * Generate video using Replicate API via local proxy
 * Uses the official models endpoint: /v1/models/{owner}/{name}/predictions
 */
async function generateWithReplicate(prompt, model, aspectRatio, token, onProgress) {
    const modelConfig = REPLICATE_MODELS[model] || REPLICATE_MODELS['minimax'];

    onProgress({ status: 'connecting', message: `Đang kết nối ${modelConfig.name}...`, progress: 10 });

    try {
        // Build the model-specific predictions endpoint
        const modelEndpoint = `${PROXY_URL}/models/${modelConfig.owner}/${modelConfig.model}/predictions`;

        // Build input based on model requirements
        const inputData = modelConfig.inputFormat(prompt);

        const requestBody = {
            input: inputData
        };

        console.log('Sending to:', modelEndpoint);
        console.log('Request body:', requestBody);

        const createResponse = await fetch(modelEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await createResponse.json();
        console.log('Response:', responseData);

        if (!createResponse.ok) {
            if (createResponse.status === 401) {
                throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại.');
            }
            if (createResponse.status === 402) {
                throw new Error('Hết credits. Vui lòng nạp thêm tại replicate.com');
            }
            if (createResponse.status === 404) {
                throw new Error('Model không tìm thấy. Vui lòng thử model khác.');
            }

            throw new Error(responseData.detail || responseData.error || `Lỗi API: ${createResponse.status}`);
        }

        const prediction = responseData;

        if (prediction.error) {
            throw new Error(prediction.error);
        }

        onProgress({ status: 'queued', message: 'Đang trong hàng đợi...', progress: 20 });

        // Step 2: Poll for completion
        let result = prediction;
        let attempts = 0;
        const maxAttempts = 120;

        while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && attempts < maxAttempts) {
            await delay(5000);
            attempts++;

            const progress = Math.min(90, 20 + (attempts / maxAttempts) * 70);
            onProgress({
                status: 'processing',
                message: `${modelConfig.name} đang tạo video... (${Math.round(progress)}%)`,
                progress
            });

            const pollResponse = await fetch(`${PROXY_URL}/predictions/${result.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!pollResponse.ok) {
                continue;
            }

            result = await pollResponse.json();

            if (result.logs) {
                console.log('Progress:', result.logs.slice(-100));
            }
        }

        if (result.status === 'failed') {
            throw new Error(result.error || 'Tạo video thất bại. Vui lòng thử lại.');
        }

        if (result.status === 'canceled') {
            throw new Error('Tạo video đã bị hủy.');
        }

        if (result.status !== 'succeeded') {
            throw new Error('Timeout: Quá thời gian chờ.');
        }

        onProgress({ status: 'complete', message: 'Hoàn thành!', progress: 100 });

        // Extract video URL
        let videoUrl = null;
        if (typeof result.output === 'string') {
            videoUrl = result.output;
        } else if (Array.isArray(result.output)) {
            videoUrl = result.output[0];
        } else if (result.output?.video) {
            videoUrl = result.output.video;
        }

        if (!videoUrl) {
            console.error('Output:', result.output);
            throw new Error('Không tìm thấy video trong kết quả.');
        }

        return {
            videoUrl,
            model: modelConfig.name,
            prompt,
            isDemo: false
        };

    } catch (error) {
        console.error('Replicate API error:', error);

        if (error.message.includes('Failed to fetch')) {
            throw new Error('Không thể kết nối proxy. Hãy chạy: npm run start');
        }

        throw error;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAvailableModels() {
    return Object.entries(REPLICATE_MODELS).map(([id, config]) => ({
        id,
        name: config.name,
        description: config.description
    }));
}

export async function validateToken(token) {
    if (!token || token.trim() === '') {
        return { valid: false, error: 'Token trống' };
    }

    try {
        const response = await fetch(`${PROXY_URL}/account`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return { valid: true, username: data.username };
        }

        return { valid: false, error: 'Token không hợp lệ' };
    } catch (error) {
        return { valid: false, error: 'Proxy server không chạy' };
    }
}
