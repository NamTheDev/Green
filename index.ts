import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  type MessageReplyOptions,
} from "discord.js";
import { Rcon } from "rcon-client";

const TOKEN = Bun.env.TOKEN;
const PASSWORD = Bun.env.PASSWORD;

if (!TOKEN || !PASSWORD) {
  console.error("Missing TOKEN or PASSWORD in environment.");
  process.exit(1);
}

const PREFIX = "$";
const RCON_CONFIG = {
  host: "minecraft-server",
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

  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    message.reply({
      content: "⚠️ You must be an Administrator to run server commands.",
      allowedMentions: { repliedUser: false },
    });
    return;
  }

  const rconCommand = message.content.slice(PREFIX.length).trim();
  if (!rconCommand) return;

  const options: MessageReplyOptions = {
    allowedMentions: { repliedUser: false, parse: [] },
  };

  try {
    const rcon = await Rcon.connect(RCON_CONFIG);
    const response = await rcon.send(rconCommand);
    rcon.end(); 

    let replyText = response ? response : "Command executed successfully (no output).";
    if (replyText.length > 2000) {
        replyText = replyText.substring(0, 1997) + "...";
    }
    
    options.content = replyText;
  } catch (error) {
    console.error("RCON Error:", error);
    options.content = "⚠️ Failed to connect to the server or execute the command.";
  }

  message.reply(options);
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(TOKEN);
