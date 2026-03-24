export default {
  PREFIX: "$",
  LOG_CHANNEL_ID: "1485921480079573153",
  LOG_FILE_PATH: "~/docker/services/minecraft-server/logs/latest.log",
  RCON_CONFIG: {
    host: "minecraft-server",
    port: 25575,
    password: Bun.env.PASSWORD!,
  },
  TOKEN: Bun.env.TOKEN,
};
