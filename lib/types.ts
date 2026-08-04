export interface FluxerUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  timezone: string | null;
  
}

export interface FluxerGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  owner_id: string | null;
  permissions: string;
}

export interface Session {
  user: FluxerUser;
  accessToken: string;
}

export interface GuildConfig {
  channelName: string | null;
  channelLimit: number | null;
  counting: boolean;
  customParent: string | null;
  manage: string | null;
  manageMessage: string | null;
}

export interface GuildData {
  id: string;
  name: string | null;
  icon: string | null;
  owner_id: string | null;
  prefix: string;
  language: string;
  dm: boolean;
  timezoneConvert: boolean;
  stickyRolesEnabled: boolean;
  roles: string[];
  joinRoles: string[];
  stickyRoles: string[];
  bypassRoles: string[];
  timedRoles: unknown[];
  tags: unknown[];
  scheduledMessages: unknown[];
  userTimezones: unknown[];
  parentChannel: string | null;
  childChannel: string | null;
  tempChannels: unknown[];
  config: GuildConfig;
}

export interface Roles {
  name: string;
  id: string;
  color: string | null;
}

export interface Channels {
  name: string;
  id: string;
  type: number;
  parent: string | null;
}

export interface BotStatus {
  ok: boolean;
  online: boolean;
  uptime: number;
  guilds: number;
  timestamp: number;
  latency: number; 
}

export interface BotHealth {
  online: boolean;
  latency: number;
  timestamp: number;
}

export interface BotStats {
  guilds: number;
  users: number; 
  activePolls: number;
  activeGiveaways: number;
  uptime: number;
  timestamp: number; 
}

export interface DashboardGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  owner_id: string | null;
  permissions: string;
  botPresent: boolean;
}
