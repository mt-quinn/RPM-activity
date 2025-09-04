import { DiscordSDK } from '@discord/embedded-app-sdk';

export type Sdk = DiscordSDK;

// Minimal shape for users returned by getInstanceConnectedUsers
export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
}

export async function initDiscordSdk(appId: string): Promise<DiscordSDK> {
  const sdk = new DiscordSDK(appId);
  await sdk.ready();
  return sdk;
}

export async function authenticate(sdk: DiscordSDK): Promise<DiscordUser | null> {
  try {
    const { user } = await (sdk as any).commands.authenticate({ access_token: null });
    return {
      id: user.id,
      username: user.global_name || user.username || 'Player',
      discriminator: user.discriminator,
      global_name: user.global_name,
    } as DiscordUser;
  } catch {
    return null;
  }
}

export async function getConnectedUsers(sdk: DiscordSDK): Promise<DiscordUser[]> {
  try {
    const res = await (sdk as any).commands.getInstanceConnectedUsers?.();
    const users = (res?.users ?? []) as any[];
    return users.map(u => ({ id: u.id, username: u.global_name || u.username, discriminator: u.discriminator, global_name: u.global_name }));
  } catch {
    return [];
  }
}

export async function deriveRoomName(sdk: DiscordSDK): Promise<{ room: string; debug: string }> {
  try {
    const gid = await (sdk as any).commands.getGuildId?.();
    const cid = await (sdk as any).commands.getChannelId?.();
    const iid = await (sdk as any).commands.getInstanceId?.();
    if (gid?.guild_id && cid?.channel_id) {
      return { room: `rpm:g${gid.guild_id}:c${cid.channel_id}`, debug: `${gid.guild_id}/${cid.channel_id}` };
    }
    if (iid?.instance_id) {
      return { room: `rpm:i${iid.instance_id}`, debug: iid.instance_id };
    }
  } catch {}
  return { room: 'rpm:global', debug: 'global' };
}

export async function getInstanceId(_sdk: DiscordSDK): Promise<string | null> {
  // Some SDK builds do not expose an instance id command yet; return null for now.
  return null;
}

export async function getInstanceConnectedUsers(_sdk: DiscordSDK): Promise<DiscordUser[]> {
  // Some SDK builds do not expose connected users yet; return empty for now.
  return [];
}


