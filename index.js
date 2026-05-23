const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");

// ================= SAFE START CHECK =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  console.log("❌ Missing TOKEN in environment variables");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.log("❌ Missing CLIENT_ID in environment variables");
  process.exit(1);
}
// ====================================================

const app = express();
app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// storage (temporary)
const linkCodes = {};
const linkedAccounts = {};

// generate 6-digit code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// BOT READY
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// /link command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "link") {
    const code = generateCode();

    linkCodes[code] = {
      discordId: interaction.user.id,
      expires: Date.now() + 5 * 60 * 1000
    };

    await interaction.reply({
      content: `🔗 Your code:\n\`${code}\`\nEnter this in Roblox (expires in 5 min)`,
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

  console.log("🔗 Linked:", userId, "→", data.discordId);

  res.send("Linked successfully");
});

// GAMEPASS REWARD ENDPOINT
app.post("/purchase", async (req, res) => {
  const { userId } = req.body;

  const discordId = linkedAccounts[userId];

  if (!discordId) {
    return res.status(404).send("User not linked");
  }

  try {
    const user = await client.users.fetch(discordId);

    await user.send({
      content: "🎉 Thanks for buying the gamepass!",
      files: ["./reward.zip"]
    });

    res.send("DM sent");
  } catch (err) {
    console.log("DM error:", err);
    res.status(500).send("Failed to DM user");
  }
});

// START SERVER (Render needs this)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 Server running on port", PORT);
});

// LOGIN BOT
client.login(TOKEN);