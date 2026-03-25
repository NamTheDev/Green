export default {
  PREFIX: "$",
  CHANNEL_ID: {
    LOG: "1485921480079573153",
    UPTIME: "1486350590710648893",
  },
  LOG_FILE_PATH: "/usr/src/app/logs/latest.log",
  RCON_CONFIG: {
    host: "minecraft-server",
    port: 25575,
    password: Bun.env.PASSWORD!,
  },
  TOKEN: Bun.env.TOKEN,
};
