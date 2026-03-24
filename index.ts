import {
  Client,
  Events,
  GatewayIntentBits,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { Rcon } from "rcon-client";
import CONFIG from "./config";

const { LOG_CHANNEL_ID, LOG_FILE_PATH, RCON_CONFIG, PREFIX, TOKEN } = CONFIG;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const LOG_REGEX =
  /^\[\d{2}:\d{2}:\d{2}\]\s+\[Server\s+thread\/INFO\]:\s+(?:\[Not\s+Secure\]\s+)?(.*)$/;

const DEATH_PATTERNS = [
  "was slain by",
  "drowned",
  "burned to death",
  "went up in flames",
  "hit the ground too hard",
  "fell from a high place",
  "blew up",
  "was shot by",
  "was pricked to death",
  "walked into fire",
  "froze to death",
  "was struck by lightning",
  "starved to death",
  "suffocated in a wall",
  "died",
  "experienced kinetic energy",
];

async function startLogTailer() {
  if (!(await Bun.file(LOG_FILE_PATH).exists())) {
    console.error(`Log file missing: ${LOG_FILE_PATH}`);
    setTimeout(startLogTailer, 5000);
    return;
  }

  const proc = Bun.spawn(["tail", "-f", "-n", "0", LOG_FILE_PATH], {
    stdout: "pipe",
    stderr: "inherit",
  });

  const decoder = new TextDecoder();

  try {
    for await (const chunk of proc.stdout) {
      const text = decoder.decode(chunk);
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      const logChannel = (await client.channels.fetch(
        LOG_CHANNEL_ID,
      )) as TextChannel;

      for (const line of lines) {
        const match = line.match(LOG_REGEX);
        if (!match || !match[1]) continue;

        const cleanLine = match[1];

        const isChat = cleanLine.startsWith("<") && cleanLine.includes(">");
        const isSayCommand =
          cleanLine.startsWith("[") && cleanLine.includes("]");
        const isJoinLeave =
          cleanLine.includes(" joined the game") ||
          cleanLine.includes(" left the game");
        const isAchievement =
          cleanLine.includes(" has made the advancement") ||
          cleanLine.includes(" has completed the challenge");
        const isDeath = DEATH_PATTERNS.some((p) => cleanLine.includes(p));

        if (isChat || isSayCommand || isJoinLeave || isAchievement || isDeath) {
          let output = cleanLine;

          if (isSayCommand && !isChat) {
            output = `[SAY] ${cleanLine}`;
          }

          await logChannel.send({
            content: `\`${output}\``,
            allowedMentions: { parse: [] },
          });
        }
      }
    }
  } catch (e) {
    console.error("Stream error:", e);
  } finally {
    proc.kill();
    setTimeout(startLogTailer, 5000);
  }
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
    console.error("RCON Error:", e);
  }
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}.`);
  startLogTailer();
});

client.login(TOKEN);
