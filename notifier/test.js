const axios = require("axios");
require('dotenv').config();
const { WebhookClient, EmbedBuilder } = require('discord.js');

// Initialize webhook client
const webhookClient = new WebhookClient({ 
    url: process.env.WEBHOOK_URL 
});

// Fetch real game economy data (limited to items with prices)
async function fetchGameEconomy(universeId) {
  try {
    // First, get the game passes
    const response = await axios.get(
      `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=10`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Discord Bot'
        }
      }
    );

    if (!response.data.data || response.data.data.length === 0) {
      console.log("No game passes found");
      return null;
    }

    // Get details for each game pass
    const gamePasses = await Promise.all(
      response.data.data.map(async (pass) => {
        try {
          const details = await axios.get(
            `https://games.roblox.com/v1/game-passes/${pass.id}`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Discord Bot'
              }
            }
          );
          return {
            name: details.data.name,
            price: details.data.price,
            id: details.data.id,
            description: details.data.description
          };
        } catch (error) {
          console.error(`Error fetching details for pass ${pass.id}:`, error.message);
          return null;
        }
      })
    );

    return gamePasses.filter(pass => pass !== null);
  } catch (error) {
    console.error("❌ API Error:", error.message);
    return null;
  }
}

// Function to send webhook message
async function sendWebhookMessage() {
  try {
    const universeId = "4619812832"; // Replace with your game's Universe ID
    const economyData = await fetchGameEconomy(universeId);

    if (!economyData || economyData.length === 0) {
      console.log("❌ No game passes available at the moment.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 **Game Passes Update**")
      .setDescription("Latest game pass values")
      .setColor("#FFA500")
      .setTimestamp();

    economyData.slice(0, 5).forEach((item) => {
      embed.addFields({
        name: item.name,
        value: `💰 **Price:** R$ ${item.price || "N/A"}\n🆔 **ID:** ${item.id || "N/A"}\n📝 **Description:** ${item.description || "No description"}`,
        inline: true,
      });
    });

    await webhookClient.send({
      embeds: [embed]
    });

    console.log('✅ Webhook message sent successfully!');
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}

// Function to run the webhook at intervals
function startWebhookInterval(intervalMinutes = 60) {
  // Send initial message
  sendWebhookMessage();
  
  // Set up interval
  setInterval(sendWebhookMessage, intervalMinutes * 60 * 1000);
  console.log(`✅ Webhook will send updates every ${intervalMinutes} minutes`);
}

// Start the webhook with updates every hour
startWebhookInterval(60);