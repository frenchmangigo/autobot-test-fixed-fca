const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "autofacebookdl",
  eventType: ["log:unsubscribe"],
  version: "1.0.0",
  credits: "Kiana",
  description: "Listen to events and automatically download Facebook videos.",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event }) {

    const tempDir = path.join(__dirname, 'cache', 'facebookdl');  // Directory for the cache
    const videoPath = path.join(tempDir, 'video.mp4'); // Path to save the downloaded video
    
    // Ensure the directory exists, if not, create it
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const regexFB = /https:\/\/www\.facebook\.com\/\S+/;
    const match = event.body?.match(regexFB);
    const url = match ? match[0] : null;

    if (match) {
        
        api.setMessageReaction("⏳", event.messageID, () => { }, true);
        api.sendTypingIndicator(event.threadID, true);

        try {

            // Use the new API URL for fetching the video download link
            const apiUrl = `https://api.joshweb.click/facebook?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const videoUrl = response.data.result;

            if (!videoUrl) {
                throw new Error("Could not retrieve video URL from the API.");
            }

            // Download the video
            let videoData = await axios.get(videoUrl, {
                responseType: 'arraybuffer'
            });

            // Send a message saying the video is downloading
            api.sendMessage('Downloading...', event.threadID, (err, info) => {
                setTimeout(() => {
                    api.unsendMessage(info.messageID);
                }, 10000);
            }, event.messageID);

            // Write the video to the local file system
            fs.writeFileSync(videoPath, Buffer.from(videoData.data, "utf-8"));

            // After 5 seconds, send the video back
            setTimeout(function() {
                api.setMessageReaction("✅", event.messageID, () => { }, true);

                return api.sendMessage({
                    body: "Downloaded Successfully.",
                    attachment: fs.createReadStream(videoPath)
                }, event.threadID, () => fs.unlinkSync(videoPath));
            }, 5000);

        } catch (e) {
            console.error(e);
            return api.sendMessage("An error occurred: " + e.message, event.threadID, event.messageID);
        }
    }
};
