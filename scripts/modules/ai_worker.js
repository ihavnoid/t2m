import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local model check
env.allowLocalModels = false;

let classifier = null;
let extractor = null;

/**
 * Loads the models.
 * We use all-MiniLM-L6-v2 for embeddings (grouping)
 * and mobilebert-uncased-mnli for zero-shot classification (hierarchy)
 */
async function init() {
    self.postMessage({ type: 'status', message: 'Downloading AI models...' });
    
    try {
        // Feature extraction for semantic similarity
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        
        // Zero-shot for "Is A child of B" logic
        classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
        
        self.postMessage({ type: 'ready' });
    } catch (e) {
        self.postMessage({ type: 'error', message: e.message });
    }
}

async function process(lines) {
    if (!extractor || !classifier) {
        self.postMessage({ type: 'error', message: 'Models not loaded' });
        return;
    }

    try {
        const depths = new Array(lines.length).fill(0);
        
        // Step 1: Get embeddings for all lines
        const embeddings = await Promise.all(lines.map(line => extractor(line, { pooling: 'mean', normalize: true })));
        
        // Step 2: Build hierarchy based on semantic similarity and specificity
        // This is a heuristic approach:
        // - A line is a child of the previous line if they are semantically related
        //   AND the current line is more specific or a sub-topic.
        
        let currentLevel = 0;
        let parentIndices = [-1]; // parentIndices[level] = index of current parent at that level

        for (let i = 1; i < lines.length; i++) {
            const prevIndex = i - 1;
            const currentLine = lines[i];
            const prevLine = lines[prevIndex];
            
            // Calculate cosine similarity
            const sim = cosineSimilarity(embeddings[i].data, embeddings[prevIndex].data);
            
            self.postMessage({ type: 'status', message: `Analyzing line ${i+1}/${lines.length}...` });

            if (sim > 0.6) {
                // Highly similar to previous line -> likely a sub-item or sibling
                // Use zero-shot to see if it's a "detail" or "specific instance"
                const result = await classifier(currentLine, ['detail', 'sub-topic', 'category', 'new topic']);
                const isDetail = result.labels[0] === 'detail' || result.labels[0] === 'sub-topic';
                
                if (isDetail) {
                    currentLevel++;
                }
                // else: same level as previous
            } else {
                // Not similar to previous -> maybe a sibling of a previous parent?
                // Look back at parents
                let foundMatch = false;
                for (let level = currentLevel - 1; level >= 0; level--) {
                    const parentIdx = parentIndices[level];
                    if (parentIdx === -1) continue;
                    
                    const parentSim = cosineSimilarity(embeddings[i].data, embeddings[parentIdx].data);
                    if (parentSim > 0.5) {
                        currentLevel = level + 1;
                        foundMatch = true;
                        break;
                    }
                }
                
                if (!foundMatch) {
                    currentLevel = 0;
                }
            }
            
            // Constrain depth growth
            if (currentLevel > depths[i-1] + 1) currentLevel = depths[i-1] + 1;
            
            depths[i] = currentLevel;
            parentIndices[currentLevel] = i;
        }

        self.postMessage({ type: 'result', data: depths });
    } catch (e) {
        self.postMessage({ type: 'error', message: e.message });
    }
}

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
    }
    return dotProduct; // Assumes normalized vectors
}

self.onmessage = async (event) => {
    const { type, lines } = event.data;
    if (type === 'process') {
        await process(lines);
    }
};

init();
