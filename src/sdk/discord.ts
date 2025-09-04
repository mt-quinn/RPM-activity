import { DiscordSDK } from '@discord/embedded-app-sdk';

export type Sdk = DiscordSDK;

// Minimal shape for users returned by getInstanceConnectedUsers
export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
}

export async function initDiscordSdk(appId: string): Promise<DiscordSDK> {
  const sdk = new DiscordSDK(appId);
  await sdk.ready();
  return sdk;
}

export async function getInstanceId(_sdk: DiscordSDK): Promise<string | null> {
  // Some SDK builds do not expose an instance id command yet; return null for now.
  return null;
}

export async function getInstanceConnectedUsers(_sdk: DiscordSDK): Promise<DiscordUser[]> {
  // Some SDK builds do not expose connected users yet; return empty for now.
  return [];
}


