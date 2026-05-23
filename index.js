const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");

const app = express();
app.use(express.json());

// ================== CONFIG ==================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
// ============================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// storage
const linkCodes = {};
const linkedAccounts = {};

// generate code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// login bot
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// /link system (we will register command later)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "link") {
    const code = generateCode();

    linkCodes[code] = {
      discordId: interaction.user.id,
      expires: Date.now() + 5 * 60 * 1000
    };

    await interaction.reply({
      content: `Your link code is:\n\`${code}\`\nEnter this in Roblox.`,
      ephemeral: true
    });
  }
});

// ROBLOX LINK ENDPOINT
app.post("/link", (req, res) => {
  const { code, userId } = req.body;

  const data = linkCodes[code];

  if (!data) return res.status(400).send("Invalid code");
  if (Date.now() > data.expires) return res.status(400).send("Expired");

  linkedAccounts[userId] = data.discordId;
  delete linkCodes[code];

  console.log("Linked:", linkedAccounts);

  res.send("Linked successfully");
});

// GAMEPASS PURCHASE ENDPOINT
app.post("/purchase", async (req, res) => {
  const { userId } = req.body;

  const discordId = linkedAccounts[userId];

  if (!discordId) return res.status(404).send("Not linked");

  try {
    const user = await client.users.fetch(discordId);

    await user.send({
      content: "🎉 Thanks for buying the gamepass!",
      files: ["./reward.zip"]
    });

    res.send("DM sent");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

// start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

client.login(TOKEN);