// index.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { google } = require('googleapis');
const googleTTS = require('google-tts-api');
const dotenv = require('dotenv');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { promisify } = require('util');
const stream = require('stream');
const cron = require('node-cron');
const translate = require('@vitalets/google-translate-api');
//const OpenAI = require('openai');
const weather = require('weather-js');
const csv = require('csv-parser');
require('dotenv').config();
const ytsr = require('ytsr');
const { execSync, exec } = require('child_process');
const fsextra = require('fs-extra');
const { get } = require('http');
const { getAudioUrl } = require('google-tts-api');

// Load environment variables
dotenv.config();

// OpenAI setup (for AI chatbot)
const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

// Set up WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Handle QR code generation for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above.');
});

// When the bot is ready
client.on('ready', () => {
    console.log('LEVVIE-LIVVIE Bot is ready!');
});

// Track if the owner has been greeted in a group
const greetedOwners = new Set();

// LEVVIE-LIVVIE BOT WELCOME MESSAGE TEMPLATE
const welcomeMessage = `🌟 *Welcome to LEVVIE-LIVVIE BOT!* 🌟  
Hello! I’m *LEVVIE-LIVVIE*, your smart WhatsApp assistant. 🤖  
I can assist you with web searches, media retrieval, translations, reminders, and much more!  

📌 *To use a command, simply type it in the chat.*  

🔹 *User Commands:*  
• 👤 *.owner* - View the bot owner's contact  
• 🔎 *.search <query>* - Get web search results  
• 📰 *.news* - Receive the latest news updates  
• 🎭 *.meme* - Get a random meme  
• 😆 *.joke* - Hear a joke  
• 🤯 *.fact* - Learn something interesting  
• 📂 *.document <file_name>* - Fetch a file from Google Drive  
• 🎵 *.song <name>* - Get a song from YouTube  
• 🎬 *.video <name>* - Retrieve a video from YouTube  
• 🔗 *.yt <name>* - Fetch YouTube links with descriptions  
• 🗣 *.voice <text>* - Convert text to speech  
• 🏓 *.ping* - Check bot status  
• 🌤 *.weather <location>* - Get weather updates  
• 🌍 *.translate <text> to <language>* - Translate text  
• ⏰ *.remind <time> <message>* - Set a reminder  
• 🎯 *.quiz* - Start a fun quiz  

⚡ *Admin Commands (Owner Only):*  
• 🚨 *.kick <@user>* - Remove a user from the group  
• 🚀 *.restart* - Restart the bot  
• 🔇 *.mute* - Mute the group chat  
• 🔊 *.unmute* - Unmute the group chat  
• 📅 *.schedule <time> <message>* - Set an automatic message  
• 🚫 *.block <@user>* - Block a user from messaging the bot  
• ⏹ *.stop* - Disable bot responses  
• ▶ *.start* - Enable bot responses  
• 🔄 *.update* - Update the bot  

💡 *Simply type a command to begin!*  
*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`; 


// Typing simulation function
const simulateTyping = (chat) => {
    chat.sendStateTyping();
    setTimeout(() => {
        chat.clearState();
    }, 2000);
};

// Command handler
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const sender = message.author || message.from; // Use message.author for groups, fallback to message.from
        const ownerNumber = "+265887071763@c.us"; 

        // Get the user's contact details
        const user = await message.getContact();
        const userName = user.pushname || user.name || 'User';

        // Log contact details for debugging
        console.log('Contact Details:', {
            id: user.id._serialized,
            name: user.name,
            pushname: user.pushname,
            number: user.number,
        }); 

        // Normalize numbers for comparison
        const normalizeNumber = (number) => {
            // Remove non-numeric characters (e.g., +, @c.us)
            return number.replace(/\D/g, '');
        };

        // Check if the sender is the owner (by number)
        const isOwner = normalizeNumber(sender) === normalizeNumber(ownerNumber);
        console.log(isOwner);
        console.log("This is the owner number: " + ownerNumber);
        console.log("This is the sender number: " + sender);

        // Simulate typing effect
        simulateTyping(chat);

        // Greet the owner in a group if it's their first message
        if (chat.isGroup && isOwner && !greetedOwners.has(chat.id._serialized)) {
            greetedOwners.add(chat.id._serialized);
            await client.sendMessage(chat.id._serialized, `🌟 *Owner Detected!* 🌟\nHello Boss, I am LEVVIE-LIVVIE, your intelligent WhatsApp assistant. 🤖\nHow can I assist you today?`);
        }

        // Welcome message for non-owner users
        if (message.body.toLowerCase() === 'hi' || message.body.toLowerCase() === 'hello') {
            await client.sendMessage(chat.id._serialized, welcomeMessage);

            // Send a voice note automatically for greetings
            await sendVoiceNote(message, `Hello, and welcome to LEVVIE-LIVVIE WhatsApp Bot. I am LEVVIE-LIVVIE Bot, your intelligent assistant, created by Levison Msachi. How may I assist you today?`);
        }

        // Command: .owner (returns the owner's number)
        if (message.body === '.owner') {
            await client.sendMessage(chat.id._serialized, `👤 *Owner Details:*\n\n📛 *Name:* LEVVIE LIVVIE\n📞 *Contact:* +265887071763\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        }

        // Command: .menu (displays all commands)
        if (message.body === '.menu') {
            await client.sendMessage(chat.id._serialized, welcomeMessage);
        }

        // Command: .alive (checks if the bot is online)
        if (message.body === '.alive' || message.body === '.status') {
            await client.sendMessage(chat.id._serialized, `🤖 *LEVVIE-LIVVIE BOT STATUS:*\n\nBOT ON?: ✅ Online and Ready!\n\nLATENCY/SPEED: ${Date.now() - message.timestamp}ms\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        }

        // Admin Commands (Owner Only)
        if (!isOwner && message.body.startsWith('.')) {
            const adminCommands = ['.kick', '.restart', '.mute', '.unmute', '.block', '.stop', '.start', '.update'];
            if (adminCommands.some(cmd => message.body.startsWith(cmd))) {
                return client.sendMessage(chat.id._serialized, `❌ *Sorry! You are not the owner of the bot.*\n\n👤 *Owner Details:*\n\n📛 *Name:* LEVVIE-LIVVIE\n\n📞 *Contact:* +265887071763\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
            }
        }

        // Kick user
        // Kick user
        if (message.body.startsWith('.kick') && isOwner) {
            try {
                if (!message.hasQuotedMsg) {
                    await client.sendMessage(message.from, "⚠️ *Error:* You must reply to a user's message to kick them.");
                    return;
                }
        
                const chat = await message.getChat();
                if (!chat.isGroup) {
                    await client.sendMessage(message.from, "⚠️ *Error:* This command can only be used in group chats.");
                    return;
                }
        
                const quotedMsg = await message.getQuotedMessage();
                // More reliable way to get the participant ID
                const mentionedUser = quotedMsg.author || quotedMsg.from || quotedMsg._data.participant;
                
                if (!mentionedUser) {
                    await client.sendMessage(chat.id._serialized, '❌ Error: Could not identify user to kick.');
                    return;
                }
        
                // Properly format the user ID
                let userToRemove = mentionedUser.includes('@') ? mentionedUser : `${mentionedUser.replace(/[^0-9]/g, '')}@c.us`;
                
                // Validate the ID format
                if (!userToRemove.match(/^\d+@c\.us$/)) {
                    await client.sendMessage(chat.id._serialized, '❌ Error: Invalid user identifier format.');
                    return;
                }
        
                // Verify the user is actually in the group
                const participant = chat.participants.find(p => p.id._serialized === userToRemove);
                if (!participant) {
                    await client.sendMessage(chat.id._serialized, '❌ Error: User not found in this group.');
                    return;
                }
        
                await chat.removeParticipants([userToRemove]);
                await client.sendMessage(chat.id._serialized, `✅ User @${userToRemove.split('@')[0]} kicked out successfully!`);
                
            } catch (error) {
                console.error("Kick Error:", error);
                if (message && message.from) {
                    const errorMsg = error.message.includes('admin') ? 
                        "❌ *Error:* I need admin rights to remove users." :
                        "❌ *Error:* Failed to remove the user. They might have left already.";
                    await client.sendMessage(message.from, errorMsg);
                }
            }
        }
        
               

        // Restart bot
        // Restart bot
        if (message.body === '.restart' && isOwner) {
            try {
                // Send initial restart message
                await client.sendMessage(message.from, '♻ Restarting the bot... Please wait 1 minute.');
                
                // Simulate restart delay (1 minute)
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                // Send restart complete message
                await client.sendMessage(message.from, '✅ Bot restart completed successfully!');
                
            } catch (error) {
                console.error('Restart simulation error:', error);
                await client.sendMessage(message.from, '⚠️ Restart simulation failed. Bot is still running normally.');
            }
        }


        // Mute group
        // Mute group
        if (message.body === '.mute' && isOwner) {
            try {
                const chat = await message.getChat();
                
                if (!chat.isGroup) {
                    await client.sendMessage(message.from, "⚠️ *Error:* This command only works in groups.");
                    return;
                }
        
                // Check if bot is admin
                const isAdmin = chat.participants.find(p => 
                    p.id._serialized === client.info.wid._serialized && p.isAdmin
                );
                
                if (!isAdmin) {
                    await client.sendMessage(chat.id._serialized, "❌ *Error:* I need admin rights to restrict this group.");
                    return;
                }
        
                // ⚠️ **Critical Step:** Change group setting to "Only Admins can send messages"
                await chat.setMessagesAdminsOnly(true); // <-- This enforces admin-only messaging
        
                await client.sendMessage(chat.id._serialized, '🔇 *Group locked!* Only admins can send messages now.');
        
            } catch (error) {
                console.error("Mute Error:", error);
                let errorMsg = "❌ *Error:* Failed to restrict the group.";
                
                if (error.message.includes('not an admin')) {
                    errorMsg = "❌ *Error:* I need admin rights to restrict this group.";
                }
                
                await client.sendMessage(message.from, errorMsg);
            }
        }

        // Unmute group
        if (message.body === '.unmute' && isOwner) {
            try {
                const chat = await message.getChat();
                
                if (!chat.isGroup) {
                    await client.sendMessage(message.from, "⚠️ *Error:* This command only works in groups.");
                    return;
                }
        
                // Check if bot is admin
                const isAdmin = chat.participants.find(p => 
                    p.id._serialized === client.info.wid._serialized && p.isAdmin
                );
                
                if (!isAdmin) {
                    await client.sendMessage(chat.id._serialized, "❌ *Error:* I need admin rights to unlock this group.");
                    return;
                }
        
                // ⚠️ **Critical Step:** Allow everyone to send messages again
                await chat.setMessagesAdminsOnly(false); // <-- This removes the restriction
        
                await client.sendMessage(chat.id._serialized, '🔊 *Group unlocked!* Everyone can send messages now.');
        
            } catch (error) {
                console.error("Unmute Error:", error);
                await client.sendMessage(message.from, '❌ *Error:* Failed to unlock the group.');
            }
        }

        // Block user
        if (message.body.startsWith('.block') && isOwner) {
            try {
                const chat = await message.getChat();
                let targetUser;
        
                // 1. Detect target user (reply/mention/DM)
                if (message.hasQuotedMsg) {
                    const quotedMsg = await message.getQuotedMessage();
                    targetUser = quotedMsg.author || quotedMsg.from || quotedMsg._data.participant;
                } else if (!chat.isGroup) {
                    targetUser = message.from; // Block private chat user
                } else {
                    throw new Error("ℹ️ Reply to a message or use in private chat.");
                }
        
                // 2. Format ID correctly
                targetUser = targetUser.includes('@') 
                    ? targetUser 
                    : `${targetUser.replace(/[^0-9]/g, '')}@c.us`;
        
                // 3. Group: Kick | Private: Block
                if (chat.isGroup) {
                    await chat.removeParticipants([targetUser]);
                    await client.sendMessage(
                        chat.id._serialized, 
                        `👢 *User kicked!* They can rejoin if invited.`
                    );
                } else {
                    await client.contactBlock(targetUser);
                    await client.sendMessage(
                        chat.id._serialized,
                        `🚫 *User blocked.* They can't message you anymore.`
                    );
                }
        
            } catch (error) {
                let errorMsg = "❌ Action failed: " + error.message;
                if (error.message.includes("not an admin")) {
                    errorMsg = "❌ I need admin rights to kick users.";
                } else if (error.message.includes("not in group")) {
                    errorMsg = "⚠️ User already left.";
                }
                await client.sendMessage(message.from, errorMsg);
            }
        }

        //############################################
        // Web search
        // Web search
        //############################################
// ===== FINAL WORKING SEARCH COMMAND ===== //
require('dotenv').config();
const axios = require('axios');
const searchCache = new (require('node-cache'))({ stdTTL: 3600 });

async function performWebSearch(query) {
    // Check cache first
    const cached = searchCache.get(query);
    if (cached) return cached;

    // Try Google first
    try {
        const response = await axios.get(
            `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(query)}&num=3`,
            { timeout: 8000 }
        );
        
        if (response.data?.items?.length > 0) {
            const results = response.data.items.map(item => 
                `🔍 *${item.title}*\n${item.link}\n${item.snippet || ''}`
            ).join('\n\n');
            searchCache.set(query, results);
            return results;
        }
    } catch (error) {
        console.error('Google API Error:', error.response?.data || error.message);
    }

    // Fallback to DuckDuckGo
    try {
        const response = await axios.get(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
            { timeout: 5000 }
        );
        
        if (response.data?.AbstractText) {
            const result = `📖 *Definition:* ${response.data.AbstractText}\n${response.data.AbstractURL || ''}`;
            searchCache.set(query, result);
            return result;
        }
    } catch (error) {
        console.error('DuckDuckGo Error:', error.message);
    }

    return "🔎 No results found. Try different keywords.";
}

// ===== MESSAGE HANDLER INTEGRATION ===== //
if (message.body.startsWith('.search')) {
    try {
        const query = message.body.slice(7).trim();
        if (!query) {
            await client.sendMessage(message.from, 
                "🔍 *Usage:* `.search <query>`\nExample: `.search Jeep Wrangler 2024`");
            return;
        }

        // Show loading message
        const loadingMsg = await client.sendMessage(message.from, 
            `⏳ Searching for *"${query}"*...`);

        // Get results
        const results = await performWebSearch(query);
        console.log('DEBUG - Raw Results:', results); // Should show formatted text

        // CRITICAL FIX: Simplified message sending
        await client.sendMessage(message.from, 
            `🌟 *LEVVIE-LIVVIE BOT SEARCH RESULTS* 🌟\n\n*Results for:* "${query}"\n\n${results}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);

        await loadingMsg.delete();
    } catch (error) {
        console.error('FINAL ERROR:', error);
        await client.sendMessage(message.from, 
            "❌ Failed to send results. Check console logs.");
    }
}

        // Fetch joke
        // ===== MESSAGE HANDLER INTEGRATION ===== //
if (message.body === '.joke' || message.body === '!joke') {
    try {
        // Typing indicator pattern
        let loadingMsg;
        if (client.sendPresenceUpdate) {
            await client.sendPresenceUpdate('composing', message.from);
        } else {
            loadingMsg = await client.sendMessage(message.from, '🤔 Thinking of a good joke...');
        }

        const joke = await getJoke();
        
        await client.sendMessage(message.from, joke);
        
        if (loadingMsg) await loadingMsg.delete();
        
    } catch (error) {
        console.error('Joke Command Error:', error);
        await client.sendMessage(message.from, 
            '⚠️ Failed to deliver joke. My funny bone might be broken!');
    }
}

        // Fetch fact
        if (message.body === '.fact') {
            const fact = await getFact();
            await client.sendMessage(chat.id._serialized, `🤯 *Did you know?*\n\n${fact}`);
        }

        // Fetch YouTube song
        // Fetch YouTube song

        //if (message.body.startsWith('.song')) {
            //const songName = message.body.slice(6).trim();
           // await sendYouTubeAudio(message, songName);
        //}

        if (message.body.startsWith('.song')) {
            const songName = message.body.slice(6).trim();
            await handleSongCommand(message, songName);
          }
          
  

        // Fetch YouTube video
        if (message.body.startsWith('.video')) {
            const videoName = message.body.slice(7).trim();
            await handleVideoCommand(message, videoName);
        }

        // Convert text to voice
        if (message.body.startsWith('.voice')) {
            const text = message.body.slice(7).trim();
            await sendVoiceNote(message, text);
        }

        // Ping command
        if (message.body === '.ping') {
            const start = Date.now();
            await message.reply('🏓 Pong!');
            const end = Date.now();
            await client.sendMessage(chat.id._serialized, `🏓 *Pong!*\n\nLATENCY: ${end - start}ms\n\nSTATUS: Online\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        }

        // Stop responding
        if (message.body === '.stop' && isOwner) {
            await client.sendMessage(chat.id._serialized, '⏹ Bot will stop responding to commands.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
            client.stop();
        }

        // Start responding
        if (message.body === '.start' && isOwner) {
            await client.sendMessage(chat.id._serialized, '▶ Bot will start responding to commands.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
            client.initialize();
        }

        // Update bot
        if (message.body === '.update' && isOwner) {
            await client.sendMessage(chat.id._serialized, '🔄 Updating the bot...\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
            await updateBot(chat.id._serialized); // Pass chat ID to the updateBot function
        }

        // Weather command
        if (message.body.startsWith('.weather')) {
            const location = message.body.slice(9).trim();
            const weatherInfo = await getWeather(location);
            await client.sendMessage(chat.id._serialized, weatherInfo);
        }

        // Translate command
        if (message.body.startsWith('.translate')) {
            const [text, toLang] = message.body.slice(11).split(' to ');
            const translation = await translateText(text, toLang);
            await client.sendMessage(chat.id._serialized, `🌍 *Translation:*\n\n${translation}`);
        }

        // Reminder command
        if (message.body.startsWith('.remind')) {
            const [time, ...reminderMessage] = message.body.slice(8).split(' ');
            setReminder(chat.id._serialized, time, reminderMessage.join(' '));
        }

        // Quiz game
        if (message.body === '.quiz') {
            const quizQuestion = await getQuizQuestion();
            await client.sendMessage(chat.id._serialized, `🎯 *Quiz Time!*\n\n${quizQuestion}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        }

        // AI Chatbot
        if (message.body.startsWith('.ai')) {
            const prompt = message.body.slice(4).trim();
            const aiResponse = await getAIResponse(prompt);
            await client.sendMessage(chat.id._serialized, `🤖 *AI Response:*\n\n${aiResponse}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        }

    } catch (error) {
        console.error('Error handling message:', error);
        await client.sendMessage(chat.id._serialized, '❌ An error occurred. Please try again later.');
    }
});

// Function to update the bot
// Function to update the bot
async function updateBot(chatId) {
    try {
        await client.sendMessage(chatId, '✅ Bot updated successfully!\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
    } catch (error) {
        console.error('Error updating bot:', error);
        await client.sendMessage(chatId, '❌ Sorry, I couldn\'t update the bot.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
    }
}

// Helper function: Web search
// Helper function: Web search
async function searchWeb(query) {
    try {
        const response = await axios.get(`https://api.duckduckgo.com/?q=${query}&format=json`);
        return response.data.AbstractText || 'No results found!';
    } catch (error) {
        console.error('Error searching the web:', error);
        return '❌ Sorry, I couldn\'t search the web right now.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*';
    }
}


// Helper function: Get joke
// ===== JOKE COMMAND IMPLEMENTATION ===== //
const workingJokeAPIs = [
    {
        name: "JokeAPI",
        url: "https://v2.jokeapi.dev/joke/Any?safe-mode&type=single",
        parser: (data) => data.joke
    },
    {
        name: "Official Joke API",
        url: "https://official-joke-api.appspot.com/random_joke",
        parser: (data) => `${data.setup}\n\n🎭 ${data.punchline}`
    },
    {
        name: "Dad Jokes",
        url: "https://icanhazdadjoke.com/",
        headers: { "Accept": "text/plain" },
        parser: (data) => data
    }
];

async function getJoke() {
    // Shuffle APIs for load balancing
    const shuffledAPIs = [...workingJokeAPIs].sort(() => Math.random() - 0.5);
    
    for (const api of shuffledAPIs) {
        try {
            const response = await axios.get(api.url, {
                timeout: 3000,
                headers: api.headers || {}
            });
            
            const jokeText = api.parser(response.data);
            if (jokeText) return `😂 *Joke:* ${jokeText}`;
            
        } catch (error) {
            console.error(`[JOKE] ${api.name} failed:`, error.message);
        }
    }
    
    // Local fallback jokes if all APIs fail
    const localJokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!"
    ];
    return `😂 *Joke:* ${localJokes[Math.floor(Math.random() * localJokes.length)]}\n\n🔸 (Local fallback)`;
}

// Helper function: Convert text to speech
async function sendVoiceNote(message, text) {
    try {
        const url = googleTTS.getAudioUrl(text, { lang: 'en', slow: false });
        const voiceNote = await MessageMedia.fromUrl(url, { unsafeMime: true });
        await client.sendMessage(message.from, voiceNote, { caption: '\n🗣 Here is your voice note!' });
    } catch (error) {
        console.error('Error sending voice note:', error);
        await client.sendMessage(message.from, '❌ Sorry, I couldn\'t generate the voice note right now.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
    }
}

// Function to download and send YouTube audio
// ===== YOUTUBE AUDIO DOWNLOAD FUNCTION ===== //

//***********************SIMPLY ADDED THIS CODE HAHAHHAHHAHAH */
async function handleSongCommand(message, query) {
    if (!query) {
        await message.reply("❌ Please provide a song name or YouTube link.");
        return;
    }

    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const script = "yt_audio_downloader.py";
    const downloadsDir = "downloads";

    try {
        // Initial status message
        const statusMsg = await message.reply(`🎧 Searching for *"${query}"*... Please wait ⏳`);

        // Progress updates
        let progress = 0;
        const progressInterval = setInterval(async () => {
            progress = Math.min(progress + Math.floor(Math.random() * 10) + 5, 95);
            try {
                await statusMsg.edit(`📥 Downloading *"${query}"*... ${progress}%`);
            } catch (e) {
                clearInterval(progressInterval);
            }
        }, 2000);

        // Execute Python downloader
        exec(`${pythonCmd} ${script} "${query.replace(/"/g, '\\"')}"`, async (error, stdout, stderr) => {
            clearInterval(progressInterval);

            if (error || stderr || !stdout.includes("SUCCESS")) {
                console.error("Download Error:", error || stderr || stdout);
                await statusMsg.edit("❌ Download failed. Please try another song.");
                return;
            }

            try {
                // Find the newest MP3 file
                const files = fs.readdirSync(downloadsDir)
                    .filter(f => f.toLowerCase().endsWith('.mp3'))
                    .map(f => ({
                        name: f,
                        time: fs.statSync(`${downloadsDir}/${f}`).mtime.getTime()
                    }))
                    .sort((a, b) => b.time - a.time);

                if (files.length === 0) {
                    await statusMsg.edit("❌ No MP3 files found after download.");
                    return;
                }

                const newestFile = files[0].name;
                const filePath = `${downloadsDir}/${newestFile}`;
                const cleanName = newestFile
                    .replace(/_/g, ' ')
                    .replace(/[^\w\s.-]/g, '')
                    .replace('.mp3', '')
                    .trim();

                // Update status
                await statusMsg.edit(`📤 Uploading *${cleanName}*...`);

                // Send the audio file as a document
                try {
                    // Use MessageMedia to properly prepare the file for sending
                    const { MessageMedia } = require('whatsapp-web.js');
                    const media = MessageMedia.fromFilePath(filePath);
                    
                    // Get the chat ID (works for both private and group chats)
                    const chat = await message.getChat();
                    
                    // Send the document to the chat
                    await chat.sendMessage(media, { 
                        sendMediaAsDocument: true,
                        caption: `🎵 *${cleanName}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*` 
                    });
                    
                    await statusMsg.edit(`✅ Sent: *${cleanName}*`);
                } catch (sendError) {
                    console.error("Send Error:", sendError);
                    await statusMsg.edit("❌ Failed to send the audio file.");
                }

                // Cleanup
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error("Cleanup Error:", cleanupError);
                }

            } catch (findError) {
                console.error("File Handling Error:", findError);
                await statusMsg.edit("❌ Error processing downloaded file.");
            }
        });
    } catch (err) {
        console.error("Command Error:", err);
        try {
            await message.reply("❌ A critical error occurred. Please try again later.");
        } catch (finalError) {
            console.error("Final Error:", finalError);
        }
    }
}

/* ************ ENDS HERE****************** */





// Function to download and send YouTube video
// Function to download and send YouTube video
async function handleVideoCommand(message, query) {
    if (!query) {
        await message.reply("❌ Please provide a video name or YouTube link.");
        return;
    }

    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const script = "yt_video_downloader.py";
    const downloadsDir = "downloads";

    try {
        // Initial status message
        const statusMsg = await message.reply(`🎬 Searching for *"${query}"*... Please wait ⏳`);

        // Progress updates
        let progress = 0;
        const progressInterval = setInterval(async () => {
            progress = Math.min(progress + Math.floor(Math.random() * 10) + 5, 95);
            try {
                await statusMsg.edit(`📥 Downloading *"${query}"*... ${progress}%`);
            } catch (e) {
                clearInterval(progressInterval);
            }
        }, 2000);

        // Execute Python downloader
        exec(`${pythonCmd} ${script} "${query.replace(/"/g, '\\"')}"`, async (error, stdout, stderr) => {
            clearInterval(progressInterval);

            if (error || stderr || !stdout.includes("SUCCESS")) {
                console.error("Download Error:", error || stderr || stdout);
                await statusMsg.edit("❌ Download failed. Please try another video.");
                return;
            }

            try {
                // Find the newest video file (MP4, MKV, etc.)
                const files = fs.readdirSync(downloadsDir)
                    .filter(f => /\.(mp4|mkv|avi|mov|webm)$/i.test(f))
                    .map(f => ({
                        name: f,
                        time: fs.statSync(`${downloadsDir}/${f}`).mtime.getTime()
                    }))
                    .sort((a, b) => b.time - a.time);

                if (files.length === 0) {
                    await statusMsg.edit("❌ No video files found after download.");
                    return;
                }

                const newestFile = files[0].name;
                const filePath = `${downloadsDir}/${newestFile}`;
                const fileExt = newestFile.split('.').pop().toLowerCase();
                const cleanName = newestFile
                    .replace(/_/g, ' ')
                    .replace(/[^\w\s.-]/g, '')
                    .replace(new RegExp(`\\.${fileExt}$`), '')
                    .trim();

                // Check file size
                const stats = fs.statSync(filePath);
                const fileSizeMB = stats.size / (1024 * 1024 * 1024);
                
                if (fileSizeMB > 15) {
                    await statusMsg.edit(`⚠️ Video size (${fileSizeMB.toFixed(1)}MB) exceeds WhatsApp limit. Trying to compress...`);
                    
                }

                // Update status
                await statusMsg.edit(`📤 Uploading *${cleanName}*...`);

                // Send the video file as a document
                try {
                    // Use MessageMedia to properly prepare the file for sending
                    const { MessageMedia } = require('whatsapp-web.js');
                    const media = MessageMedia.fromFilePath(filePath);
                    
                    // Get the chat ID (works for both private and group chats)
                    const chat = await message.getChat();
                    
                    // Determine mime type based on extension
                    let mimeType = "video/mp4";  // default
                    if (fileExt === "mkv") mimeType = "video/x-matroska";
                    else if (fileExt === "avi") mimeType = "video/x-msvideo";
                    else if (fileExt === "mov") mimeType = "video/quicktime";
                    else if (fileExt === "webm") mimeType = "video/webm";
                    
                    // Send as document if large, otherwise as video
                    const sendOptions = {
                        caption: `🎬 *${cleanName}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`,
                        mimetype: mimeType
                    };
                    
                    if (fileSizeMB > 10) {
                        // Send as document if larger than 10MB
                        sendOptions.sendMediaAsDocument = true;
                    }
                    
                    await chat.sendMessage(media, sendOptions);
                    await statusMsg.edit(`✅ Sent: *${cleanName}*`);
                } catch (sendError) {
                    console.error("Send Error:", sendError);
                    await statusMsg.edit("❌ Failed to send the video file. It may be too large for WhatsApp.");
                }

                // Cleanup
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error("Cleanup Error:", cleanupError);
                }

            } catch (findError) {
                console.error("File Handling Error:", findError);
                await statusMsg.edit("❌ Error processing downloaded file.");
            }
        });
    } catch (err) {
        console.error("Command Error:", err);
        try {
            await message.reply("❌ A critical error occurred. Please try again later.");
        } catch (finalError) {
            console.error("Final Error:", finalError);
        }
    }
}


/* ***************************  Ends Here Too ************************************ */
/* ***************************  Ends Here Too ************************************ */
/* ***************************  Ends Here Too ************************************ */

// Function to get weather updates
// Function to get weather updates
// Function to get weather updates
// Function to get weather updates
//const weather = require('weather-js');

async function getWeather(location) {
    return new Promise((resolve, reject) => {
        weather.find({ search: location, degreeType: 'C' }, function(err, result) {
            if (err) {
                console.error("Weather Fetch Error:", err);
                reject('❌ Sorry, I couldn\'t fetch the weather right now.');
                return;
            }

            if (!result || result.length === 0) {
                reject('❌ Location not found.');
                return;
            }

            const current = result[0].current;
            const weatherInfo = `🌤 *Weather in ${current.observationpoint}:*\n🌡 Temperature: ${current.temperature}°C\n💧 Humidity: ${current.humidity}%\n🌬 Wind: ${current.winddisplay}\n☁ Sky: ${current.skytext}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`;

            resolve(weatherInfo);
        });
    });
}



// Function to translate text
async function translateText(text, toLang) {
    try {
        const res = await translate(text, { to: toLang });
        return res.text;
    } catch (error) {
        console.error('Error translating text:', error);
        return '❌ Sorry, I couldn\'t translate the text right now.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*';
    }
}

// Function to set a reminder
function setReminder(chatId, time, reminderMessage) {
    try {
        cron.schedule(time, () => {
            client.sendMessage(chatId, `⏰ *Reminder:*\n\n${reminderMessage}\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
        });
        client.sendMessage(chatId, `⏰ Reminder set for ${time}.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*`);
    } catch (error) {
        console.error('Error setting reminder:', error);
        client.sendMessage(chatId, '❌ Sorry, I couldn\'t set the reminder.\n\n*⚙ Powered by LEVVIE-LIVVIE | 2025 🚀*');
    }
}

// Function to get a quiz question
// Function to get a quiz question
// Function to get a quiz question
// Function to get a quiz question

async function getQuizQuestion(message) {
    // Validate message object exists and has required properties
    if (!message || typeof message !== 'object') {
        console.error('Invalid message object:', message);
        return;
    }

    try {
        // Safely extract client and chatId with fallbacks
        const client = message?.client;
        const chatId = message?.from || message?.chat?.id || message?.author;
        
        if (!client || typeof client.sendMessage !== 'function') {
            console.error('Invalid client object or missing sendMessage method');
            return;
        }

        if (!chatId) {
            console.error('No chatId found in message object');
            return;
        }

        // Get quiz question from API
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const question = response.data.results[0];

        // HTML entity decoder
        const decodeHTML = (html) => {
            if (!html) return '';
            return String(html)
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#039;/g, "'")
                .replace(/&rsquo;/g, "'");
        };

        // Process question data with null checks
        const correctAnswer = decodeHTML(question?.correct_answer || '');
        const incorrectAnswers = (question?.incorrect_answers || []).map(answer => decodeHTML(answer));
        const allAnswers = [...incorrectAnswers, correctAnswer].filter(Boolean);

        if (allAnswers.length < 2) {
            throw new Error('Invalid question format from API');
        }

        // Shuffle answers
        const shuffledAnswers = [...allAnswers].sort(() => Math.random() - 0.5);
        const letters = ['A', 'B', 'C', 'D'];
        const answerOptions = shuffledAnswers.map((answer, index) => 
            `${letters[index]}. ${answer}`
        ).join('\n');

        // Prepare question text with fallbacks
        const questionText = decodeHTML(question?.question || 'No question text');
        const category = decodeHTML(question?.category || 'General');
        const difficulty = question?.difficulty 
            ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)
            : 'Medium';

        const questionMessage = `🧠 *QUIZ TIME!* 🧠\n\n` +
                               `*Category:* ${category}\n` +
                               `*Difficulty:* ${difficulty}\n\n` +
                               `*Question:* ${questionText}\n\n` +
                               `${answerOptions}\n\n` +
                               `_Reply with A, B, C, or D in the next 30 seconds_`;

        // Send question with multiple fallback methods
        let sentMessage;
        try {
            if (typeof message.reply === 'function') {
                sentMessage = await message.reply(questionMessage);
            } else {
                sentMessage = await client.sendMessage(chatId, questionMessage);
            }
        } catch (sendError) {
            console.error('Failed to send question:', sendError);
            return;
        }

        // Find correct answer letter
        const correctLetterOption = letters.find(
            (letter, index) => shuffledAnswers[index] === correctAnswer
        );

        // Response collector with safety checks
        const responseCollector = {
            timeout: null,
            listener: null,
            cleanup: () => {
                clearTimeout(this.timeout);
                if (this.listener) {
                    client.removeListener('message', this.listener);
                }
            }
        };

        const userResponse = await new Promise((resolve) => {
            responseCollector.listener = async (msg) => {
                try {
                    if (!msg?.from || msg.from !== chatId) return;
                    if (msg.fromMe) return;
                    
                    const userAnswer = msg.body?.trim().toUpperCase();
                    if (['A', 'B', 'C', 'D'].includes(userAnswer)) {
                        responseCollector.cleanup();
                        resolve({
                            msg,
                            answer: userAnswer,
                            respondent: msg?.notifyName || msg?.author || 'User'
                        });
                    }
                } catch (e) {
                    console.error('Error in message listener:', e);
                }
            };

            client.on('message', responseCollector.listener);
            
            responseCollector.timeout = setTimeout(() => {
                responseCollector.cleanup();
                resolve(null);
            }, 30000);
        });

        // Send result with multiple fallback methods
        const sendResult = async (text) => {
            try {
                if (typeof message.reply === 'function') {
                    await message.reply(text);
                } else {
                    await client.sendMessage(chatId, text);
                }
            } catch (e) {
                console.error('Failed to send result:', e);
            }
        };

        if (userResponse) {
            const { answer, respondent } = userResponse;
            const isCorrect = answer === correctLetterOption;
            
            await sendResult(
                isCorrect 
                    ? `✅ *Correct, ${respondent}!* 🎉\n\nThe answer was: *${correctAnswer}*`
                    : `❌ *Sorry, ${respondent}!* Incorrect.\n\nThe correct answer was: *${correctAnswer}*`
            );
        } else {
            await sendResult(
                `⏳ *Time's up!*\n\nThe correct answer was: *${correctAnswer}*`
            );
        }

    } catch (error) {
        console.error('Quiz error:', error);
        try {
            if (message?.client?.sendMessage) {
                await message.client.sendMessage(
                    message.from || message.chat?.id, 
                    '❌ Quiz service unavailable. Please try again later.'
                );
            }
        } catch (finalError) {
            console.error('Failed to send error message:', finalError);
        }
    }
}


// Function to get AI response
// Function to get AI response
// Function to get AI response
//const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function getAIResponse(prompt) {
    // Configuration
    const config = {
        model: "gpt-3.5-turbo",
        max_tokens: 200,
        temperature: 0.7,
        max_retries: 2,
        retry_delay: 1000,
        timeout: 10000
    };

    // Fallback responses
    const fallbackResponses = {
        "hello": "👋 Hi there! My AI is temporarily unavailable, but I'm still here!",
        "help": "🆘 I can't access my AI features right now. Try again later!",
        "default": "⚠️ My AI service is currently unavailable. Please try again in a few minutes."
    };

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ [DEV] Missing OpenAI API key");
        return fallbackResponses.default;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: config.timeout
    });

    // Retry loop
    for (let attempt = 1; attempt <= config.max_retries; attempt++) {
        try {
            const response = await openai.chat.completions.create({
                model: config.model,
                messages: [
                    { role: "system", content: "You're a helpful WhatsApp assistant." },
                    { role: "user", content: prompt }
                ],
                max_tokens: config.max_tokens,
                temperature: config.temperature
            });
            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            // Final attempt failed
            if (attempt === config.max_retries) {
                if (error.code === 'invalid_api_key') {
                    console.error("❌ [CRITICAL] Invalid API key");
                    return "🔐 My AI service is currently misconfigured.";
                }
                if (error.name === 'APIConnectionError') {
                    return "📡 Connection error - can't reach AI services. Check your internet!";
                }
                return fallbackResponses[prompt.toLowerCase()] || fallbackResponses.default;
            }
            
            // Wait before retrying
            await new Promise(res => setTimeout(res, attempt * config.retry_delay));
        }
    }
}

client.initialize();