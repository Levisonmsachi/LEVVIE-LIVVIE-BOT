require('dotenv').config();
const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Google Search API
async function googleSearch(query) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(query)}&num=3`;
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return response.data.items?.map(item => 
            `📌 *${item.title}*\n${item.link}\n${item.snippet || ''}`
        ).join('\n\n') || "No Google results found.";
    } catch (error) {
        console.error("Google Search Error:", error.message);
        return null;
    }
}

// DuckDuckGo Fallback
async function duckDuckGoSearch(query) {
    try {
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
        if (response.data.AbstractText) {
            return `📖 *Definition:* ${response.data.AbstractText}\n${response.data.AbstractURL || ''}`;
        }
        return null;
    } catch (error) {
        console.error("DuckDuckGo Error:", error.message);
        return null;
    }
}

module.exports = {
    handleSearch: async (message, client) => {
        const query = message.body.slice(7).trim();
        if (!query) {
            return client.sendMessage(message.from, "🔍 *Usage:* `.search <query>`\nExample: `.search AI trends 2025`");
        }

        try {
            await client.sendPresenceUpdate('composing', message.from);
            const loadingMsg = await client.sendMessage(message.from, `⏳ Searching for *"${query}"*...`);

            let results = cache.get(query) || await googleSearch(query);
            if (!results) results = await duckDuckGoSearch(query) || "❌ No results found from any search provider.";

            await client.sendMessage(message.from, {
                text: `🔍 *Results for "${query}"*\n\n${results}\n\n_Powered by LEVVIE-LIVVIE_`,
                linkPreview: true
            });

            await loadingMsg.delete();
        } catch (error) {
            console.error("Search Command Error:", error);
            await client.sendMessage(message.from, "⚠️ Search service is currently unavailable.");
        }
    }
};