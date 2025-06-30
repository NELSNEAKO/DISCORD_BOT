require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// const placeId = '126884695634066';

// Function to fetch Roblox game details
async function getRobloxGameDetails(placeId) {
  try {
    // Step 1: Get Universe IDn
    const universeRes = await axios.get(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    const universeId = universeRes.data.universeId;

    // Step 2: Get Game Details
    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`
    );
    const game = gameRes.data.data[0];

    // Step 3: Get Thumbnail (optional)
    const thumbRes = await axios.get(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`
    );
    const thumbnail = thumbRes.data.data[0]?.imageUrl || null;

    return { game, thumbnail };
  } catch (error) {
    console.error('Error fetching Roblox data:', error);
    return null;
  }
}

// Bot message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Check if message contains a Roblox game URL
  const robloxUrlMatch = message.content.match(/roblox\.com\/games\/(\d+)/);
  if (!robloxUrlMatch) return;

  const placeId = robloxUrlMatch[1];
  const gameData = await getRobloxGameDetails(placeId);

  console.log(gameData);

  if (!gameData) {
    return message.reply('❌ Failed to fetch game details. Please try again later.');
  }

  const { game, thumbnail } = gameData;

  // Create a rich embed response
  const embed = {
    title: game.name,
    url: `https://www.roblox.com/games/${placeId}/`,
    description: game.description || 'No description available',
    color: 0x00ff00,
    fields: [
      { name: '👥 Creator', value: game.creator.name, inline: true },
      { name: '🔢 Visits', value: game.visits.toLocaleString(), inline: true },
      { name: '📅 Created', value: new Date(game.created).toLocaleDateString(), inline: true }
    ],
    thumbnail: thumbnail ? { url: thumbnail } : null,
    footer: { text: 'Roblox Game Information' }
  };

  message.reply({ embeds: [embed] });
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
console.log('Bot is online!');