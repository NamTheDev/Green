import {
  Client,
  Events,
  GatewayIntentBits,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { Rcon } from "rcon-client";
import { watchFile } from "node:fs";
import CONFIG from "./config";

const { LOG_CHANNEL_ID, LOG_FILE_PATH, RCON_CONFIG, PREFIX, TOKEN } = CONFIG;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DEATH_MESSAGES = [
  " was slain by ", " drowned", " burned to death", " went up in flames",
  " hit the ground too hard", " fell from a high place", " blew up",
  " was shot by ", " was pricked to death", " walked into fire",
  " froze to death", " was struck by lightning", " starved to death",
  " suffocated in a wall", " died", " experienced kinetic energy"
];

async function startLogTailer() {
  const file = Bun.file(LOG_FILE_PATH);

  if (!(await file.exists())) {
    console.error(`Log file not found at ${LOG_FILE_PATH}`);
    return;
  }

  let lastSize = file.size;

  watchFile(LOG_FILE_PATH, { interval: 1000 }, async (curr, prev) => {
    if (curr.size < prev.size) {
      lastSize = curr.size;
      return;
    }

    if (curr.size === lastSize) return;

    const newContent = await file.slice(lastSize, curr.size).text();
    lastSize = curr.size;

    const lines = newContent.split("\n").filter((l) => l.trim() !== "");
    const logChannel = (await client.channels.fetch(
      LOG_CHANNEL_ID,
    )) as TextChannel;

    for (const line of lines) {
      const splitIndex = line.indexOf("]: ");
      if (splitIndex === -1) continue;

      const cleanLine = line.substring(splitIndex + 3);

      const isChat = cleanLine.startsWith("<") && cleanLine.includes(">");
      const isJoinLeave = cleanLine.includes(" joined the game") || cleanLine.includes(" left the game");
      const isAchievement = cleanLine.includes(" has made the advancement") || cleanLine.includes(" has completed the challenge");
      const isDeath = DEATH_MESSAGES.some((msg) => cleanLine.includes(msg));

      if (isChat || isJoinLeave || isAchievement || isDeath) {
        await logChannel.send({
          content: `\`${cleanLine}\``,
          allowedMentions: { parse: [] },
        });
      }
    }
  });
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator))
    return;

  const rconCommand = message.content.slice(PREFIX.length).trim();
  try {
    const rcon = await Rcon.connect(RCON_CONFIG);
    const response = await rcon.send(rconCommand);
    rcon.end();
    if (response) {
      await message.reply({
        content:
          response.length > 2000
            ? response.substring(0, 1997) + "..."
            : response,
        allowedMentions: { parse: [] },
      });
    }
  } catch (e) {
    console.error(e);
  }
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}.`);
  startLogTailer();
});

client.login(TOKEN);