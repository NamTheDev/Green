import { Rcon } from "rcon-client";
import { GuildMember, PermissionsBitField } from "discord.js";

export async function sendRconCommand(
  command: string,
  config: any,
): Promise<string> {
  const rcon = await Rcon.connect(config);
  const response = await rcon.send(command);
  await rcon.end();
  return response;
}

export function isAdmin(member: GuildMember | null | undefined): boolean {
  if (!member) return false;
  return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,16}$/.test(username);
}
