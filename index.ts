import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  TextChannel,
  type MessageReplyOptions,
} from "discord.js";
import { Rcon } from "rcon-client";
import { watch } from "node:fs";
import { LOG_CHANNEL_ID, LOG_FILE_PATH } from "./config.json";

const TOKEN = Bun.env.TOKEN;
const PASSWORD = Bun.env.PASSWORD;

if (!TOKEN || !PASSWORD) {
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
  ],
});

async function startLogTailer() {
  const file = Bun.file(LOG_FILE_PATH);
  if (!(await file.exists())) return;

  let lastSize = file.size;

  watch(LOG_FILE_PATH, async (event) => {
    if (event === "change") {
      const currentSize = (await Bun.file(LOG_FILE_PATH)).size;

      if (currentSize < lastSize) {
        lastSize = currentSize;
        return;
      }

      const newContent = await file.slice(lastSize, currentSize).text();
      lastSize = currentSize;

      const lines = newContent.split("\n").filter((l) => l.trim() !== "");
      const logChannel = (await client.channels.fetch(
        LOG_CHANNEL_ID,
      )) as TextChannel;

      for (const line of lines) {
        const isChat = /<.*>/.test(line);
        const isJoinLeave = /joined the game|left the game/.test(line);
        const isAchievement =
          /has made the advancement|has completed the challenge/.test(line);
        const isDeath =
          /was slain by|drowned|burned to death|hit the ground too hard/.test(
            line,
          );

        if (isChat || isJoinLeave || isAchievement || isDeath) {
          const cleanLine = line.replace(
            /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /,
            "",
          );
          await logChannel.send({
            content: `\`${cleanLine}\``,
            allowedMentions: { parse: [] },
          });
        }
      }
    }
  });
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator))
    return;

  const rconCommand = message.content.slice(PREFIX.length).trim();
  try {
    const rcon = await Rcon.connect(RCON_CONFIG);
    const response = await rcon.send(rconCommand);
    rcon.end();
    if (response) {
      await message.reply(
        response.length > 2000 ? response.substring(0, 1997) + "..." : response,
      );
    }
  } catch (e) {
    console.error(e);
  }
});

client.once("ready", () => {
  startLogTailer();
});

client.login(TOKEN);
