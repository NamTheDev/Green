import { Client, GatewayIntentBits } from "discord.js";
import {
  processWhitelist,
  processBlacklist,
  processBan,
  processUnban,
  processCheck,
  processList,
  processHelp,
  processLeave,
} from "./logic";

const TOKEN = Bun.env.TOKEN;
const PASSWORD = Bun.env.PASSWORD;

if (!TOKEN || !PASSWORD) {
  process.exit(1);
}

const PREFIX = "$";
const RCON_CONFIG = {
  host: "127.0.0.1",
  port: 25575,
  password: PASSWORD,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  switch (command) {
    case "whitelist":
      message.reply(await processWhitelist(args, message, RCON_CONFIG));
      break;
    case "blacklist":
      message.reply(await processBlacklist(message, RCON_CONFIG));
      break;
    case "ban":
      message.reply(await processBan(args, message, RCON_CONFIG));
      break;
    case "unban":
      message.reply(await processUnban(args, message, RCON_CONFIG));
      break;
    case "check":
      message.reply(processCheck(message));
      break;
    case "list":
      message.reply(processList(message));
      break;
    case "help":
      message.reply(processHelp(PREFIX));
      break;
  }
});

client.on("guildMemberRemove", async (member) => {
  await processLeave(member.id, RCON_CONFIG);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(TOKEN);
