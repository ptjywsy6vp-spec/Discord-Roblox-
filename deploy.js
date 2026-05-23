const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Roblox account"),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Check if you are linked")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Deploying commands...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands deployed!");
  } catch (err) {
    console.log(err);
  }
})();