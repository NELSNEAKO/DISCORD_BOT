const axios = require("axios");
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Initialize the Discord client
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

// Fetch real game economy data (limited to items with prices)
async function fetchGameEconomy(universeId) {
  try {
    const response = await axios.get(
      `https://economy.roblox.com/v1/games/${universeId}/game-passes?limit=10`
    );
    return response.data.data;
  } catch (error) {
    console.error("❌ API Error:", error.message);
    return null;
  }
}

// Update the !stocks command
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!stocks") {
    const universeId = "4619812832"; // Replace with your game's Universe ID
    const economyData = await fetchGameEconomy(universeId);

    if (!economyData) {
      return message.reply("❌ Failed to fetch stock data. Try again later.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 **In-Game Stocks**")
      .setDescription("Latest item values")
      .setColor("#FFA500");

    economyData.slice(0, 5).forEach((item) => {
      embed.addFields({
        name: item.name,
        value: `💰 **Price:** R$ ${item.price || "N/A"}`,
        inline: true,
      });
    });

    message.reply({ embeds: [embed] });
  }
});