import {
  Client,
  GatewayIntentBits,
  MessagePayload,
  type MessageReplyOptions,
} from "discord.js";
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
  const options: MessageReplyOptions = {
    allowedMentions: { repliedUser: false, parse: [] },
  };

  switch (command) {
    case "whitelist":
      options.content = await processWhitelist(args, message, RCON_CONFIG);
      break;
    case "blacklist":
      options.content = await processBlacklist(message, RCON_CONFIG);
      break;
    case "ban":
      options.content = await processBan(args, message, RCON_CONFIG);
      break;
    case "unban":
      options.content = await processUnban(args, message, RCON_CONFIG);
      break;
    case "check":
      options.content = processCheck(message);
      break;
    case "list":
      options.content = processList(message);
      break;
    case "help":
      options.content = processHelp(PREFIX);
      break;
  }

  message.reply(options);
});

client.on("guildMemberRemove", async (member) => {
  await processLeave(member.id, RCON_CONFIG);
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(TOKEN);
