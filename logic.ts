import { Message } from "discord.js";
import { saveMember, getMember, deleteMember, getAllMembers } from "./db";
import { sendRconCommand, isAdmin, isValidUsername } from "./util";

export async function processWhitelist(
  args: string[],
  message: Message,
  rconConfig: any,
): Promise<string> {
  if (!isAdmin(message.member)) {
    return "❌ You do not have permission to use this command.";
  }

  const mcUsername = args[0];
  const targetUser = message.mentions.users.first();

  if (!mcUsername || !targetUser) {
    return "Usage: `$whitelist <MinecraftUsername> <@User>`";
  }

  if (!isValidUsername(mcUsername)) {
    return "That does not look like a valid Minecraft username.";
  }

  try {
    const response = await sendRconCommand(
      `whitelist add ${mcUsername}`,
      rconConfig,
    );
    saveMember.run(targetUser.id, mcUsername);
    return `✅ **${mcUsername}** has been added to the whitelist for <@${targetUser.id}>!\nServer says: \`${response}\``;
  } catch (error) {
    return "❌ Failed to connect to the Minecraft server.";
  }
}

export async function processBlacklist(
  message: Message,
  rconConfig: any,
): Promise<string> {
  if (!isAdmin(message.member)) {
    return "❌ You do not have permission to use this command.";
  }

  const targetUser = message.mentions.users.first();

  if (!targetUser) {
    return "Usage: `$blacklist <@User>`";
  }

  const record = getMember.get(targetUser.id) as
    | { mc_username: string }
    | undefined;

  if (!record) {
    return "❌ That user is not currently in the database.";
  }

  try {
    await sendRconCommand(`whitelist remove ${record.mc_username}`, rconConfig);
    await sendRconCommand(
      `kick ${record.mc_username} You have been blacklisted by an administrator.`,
      rconConfig,
    );
    deleteMember.run(targetUser.id);
    return `✅ Successfully blacklisted **${record.mc_username}** and removed them from the database.`;
  } catch (error) {
    return "❌ Failed to execute RCON commands.";
  }
}

export async function processBan(
  args: string[],
  message: Message,
  rconConfig: any,
): Promise<string> {
  if (!isAdmin(message.member)) {
    return "❌ You do not have permission to use this command.";
  }

  const mcUsername = args[0];

  if (!mcUsername) {
    return "Usage: `$ban <MinecraftUsername>`";
  }

  try {
    const response = await sendRconCommand(
      `ban ${mcUsername} Banned by administrator.`,
      rconConfig,
    );
    return `✅ **${mcUsername}** has been banned!\nServer says: \`${response}\``;
  } catch (error) {
    return "❌ Failed to connect to the Minecraft server.";
  }
}

export async function processUnban(
  args: string[],
  message: Message,
  rconConfig: any,
): Promise<string> {
  if (!isAdmin(message.member)) {
    return "❌ You do not have permission to use this command.";
  }

  const mcUsername = args[0];

  if (!mcUsername) {
    return "Usage: `$unban <MinecraftUsername>`";
  }

  try {
    const response = await sendRconCommand(`pardon ${mcUsername}`, rconConfig);
    return `✅ **${mcUsername}** has been unbanned!\nServer says: \`${response}\``;
  } catch (error) {
    return "❌ Failed to connect to the Minecraft server.";
  }
}

export function processCheck(message: Message): string {
  const record = getMember.get(message.author.id) as
    | { mc_username: string }
    | undefined;

  if (record) {
    return `✅ You are currently whitelisted as **${record.mc_username}**.`;
  }

  return `❌ You are not on the whitelist.`;
}

export function processList(message: Message): string {
  if (!isAdmin(message.member)) {
    return "❌ You do not have permission to use this command.";
  }

  const allMembers = getAllMembers.all() as {
    discord_id: string;
    mc_username: string;
  }[];

  if (allMembers.length === 0) {
    return "The whitelist is currently empty.";
  }

  const listString = allMembers
    .map((row) => `• <@${row.discord_id}>: **${row.mc_username}**`)
    .join("\n");

  return `**Whitelisted Members (${allMembers.length}):**\n${listString}`;
}

export function processHelp(prefix: string): string {
  const adminCommands = `**Admin Commands:**
\`${prefix}whitelist <MinecraftUsername> <@User>\` - Adds a specific user to the server whitelist and database.
\`${prefix}blacklist <@User>\` - Removes a user from the database, takes them off the whitelist, and kicks them.
\`${prefix}ban <MinecraftUsername>\` - Bans a Minecraft player entirely from the server.
\`${prefix}unban <MinecraftUsername>\` - Removes a ban from a Minecraft player.
\`${prefix}list\` - Displays a list of all verified Discord members and their linked Minecraft accounts.`;

  const userCommands = `**User Commands:**
\`${prefix}check\` - Verifies if you are currently in the database and shows your linked Minecraft username.
\`${prefix}help\` - Displays this categorized command list.`;

  return `${adminCommands}\n\n${userCommands}`;
}

export async function processLeave(
  memberId: string,
  rconConfig: any,
): Promise<void> {
  const record = getMember.get(memberId) as { mc_username: string } | undefined;

  if (record) {
    try {
      await sendRconCommand(
        `whitelist remove ${record.mc_username}`,
        rconConfig,
      );
      await sendRconCommand(
        `kick ${record.mc_username} You left the Discord server!`,
        rconConfig,
      );
      deleteMember.run(memberId);
    } catch (error) {
      console.error(error);
    }
  }
}
