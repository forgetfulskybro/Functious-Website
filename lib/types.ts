export interface FluxerUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  timezone: string | null;
  birthday?: BirthdayData | null;
}

export interface BirthdayData {
  day: number | null;
  month: number | null;
  age: number | null;
  lastBirthday: number | null;
  ping: boolean;
  enabledGuilds: string[];
}

export interface GuildBirthdayEntry {
  userId: string;
  username: string | null;
  globalName: string | null;
  avatar: string | null;
  month: number;
  day: number;
  age: number | null;
  nextTs: number;
}

export interface GuildMember {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface UserProfile {
  id: string;
  username: string | null;
  globalName: string | null;
  avatar: string | null;
  avatarUrl: string | null;
  pending?: boolean;
}

export interface ChannelProfile {
  id: string;
  name: string | null;
  type?: number | null;
  guildId?: string | null;
  guildName?: string | null;
  pending?: boolean;
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
  managevc: boolean | null;
}

export interface StickyEmbedData {
  title?: string | null;
  description?: string | null;
  footer?: { text?: string | null; iconURL?: string | null } | null;
  image?: string | null;
  thumbnail?: string | null;
  author?: { name?: string | null; iconURL?: string | null; url?: string | null } | null;
  url?: string | null;
  color?: string | null;
  useTimestamp?: boolean | null;
}

export interface StickyEntry {
  id: string;
  channelId: string;
  type: 'content' | 'embed' | 'script';
  content?: string | null;
  embedData?: StickyEmbedData | null;
  enabled: boolean;
  stickyMessageId?: string | null;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  sendCount?: number;
  lastSentAt?: number | null;
  repostDelayMs?: number;
  mentionPolicy?: 'none' | 'users' | 'roles' | 'everyone';
}

export interface GuildChannel {
  id: string;
  name: string;
  type: number;
  parentId?: string | null;
}

export interface GuildRole {
  id: string;
  name: string;
  color?: number | string | null;
  position?: number;
  permissions?: string;
}

export interface GuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}
export interface CommandCatalogEntry {
  name: string;
  aliases: string[];
  description: string | null;
  category: string;
  cooldownMs: number;
  permissions: string | null;
}

export interface CommandSetting {
  name: string;
  enabled: boolean;
  cooldownMs: number | null;
  allowedChannels: string[];
  allowedRoles: string[];
  deleteInvocation: boolean;
}

export interface GuildData {
  id: string;
  name: string | null;
  icon: string | null;
  owner_id: string | null;
  prefix: string;
  language: string;
  dm: boolean;
  pollPerm?: boolean;
  timezoneConvert: boolean;
  stickyRolesEnabled: boolean;
  roles: string[];
  joinRoles: string[];
  stickyRoles: string[];
  bypassRoles: string[];
  timedRoles: unknown[];
  tags: unknown[];
  tagTriggerBots: boolean;
  scheduledMessages: unknown[];
  stickies: StickyEntry[];
  commandSettings: CommandSetting[];
  commandCatalog: CommandCatalogEntry[];
  guildChannels: GuildChannel[];
  guildRoles: GuildRole[];
  emojis?: GuildEmoji[];
  mediaChannels: unknown[];
  userTimezones: unknown[];
  parentChannel: string | null;
  childChannel: string | null;
  tempChannels: unknown[];
  config: GuildConfig;
  birthdayChannel: string | null;
  birthdayRole: string | null;
  birthdayPing: boolean;
  birthdayBlacklist: string[];
  birthdayMessageWithAge: string | null;
  birthdayMessageNoAge: string | null;
  communityBirthday?: CommunityBirthdaySettings | null;
}

export interface CommunityBirthdaySettings {
  month: number | null;
  day: number | null;
  year: number | null;
  enabled: boolean;
  channelId: string | null;
  roleId: string | null;
  ping: boolean;
  message: string | null;
  timezone: string;
  lastAnnouncedYear: number | null;
}

export type EventStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface EventRsvpOptions {
  going: { emoji: string; label: string };
  maybe: { emoji: string | null; label: string; enabled: boolean };
  declined: { emoji: string | null; label: string; enabled: boolean };
}

export interface EventReminder {
  offsetMs: number;
  mode: 'channel' | 'dm' | 'both';
  message?: string | null;
  sent?: boolean;
}

export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  until: number | null;
  spawnedAt?: number;
  completed?: boolean;
}

export interface EventRsvpCounts {
  going: number;
  maybe: number;
  declined: number;
  waitlist: number;
}

export interface GuildEvent {
  id: string;
  messageId: string | null;
  guildId: string | null;
  channelId: string | null;
  hostId: string | null;
  title: string | null;
  description: string | null;
  footer: string | null;
  startAt: number | null;
  endAt: number | null;
  timezone: string | null;
  location: string | null;
  imageUrl: string | null;
  color: string | null;
  capacity: number | null;
  waitlistEnabled: boolean;
  attendeeRoleId: string | null;
  signupCutoffAt: number | null;
  postAt: number | null;
  postedAt: number | null;
  rsvpOptions: EventRsvpOptions | null;
  reminders: EventReminder[];
  pingRoleId: string | null;
  requiredRoleIds: string[];
  status: EventStatus | null;
  recurrence: EventRecurrence | null;
  createdAt: number | null;
  updatedAt: number | null;
  rsvpCounts?: EventRsvpCounts | null;
}

export interface EventRsvp {
  userId: string;
  response: 'going' | 'maybe' | 'declined';
  waitlisted: boolean;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface GuildEventDetail {
  event: GuildEvent;
  rsvps: EventRsvp[];
}

export type FormStatus = 'draft' | 'open' | 'closed';
export type FormQuestionType = 'text' | 'paragraph' | 'choice';

export interface FormQuestionChoice {
  label: string;
  emoji?: string | null;
}

export interface FormQuestion {
  id: string;
  type: FormQuestionType;
  prompt: string;
  required: boolean;
  minLength: number;
  maxLength: number;
  choices: FormQuestionChoice[];
}

export interface GuildForm {
  id: string;
  guildId: string | null;
  name: string | null;
  description: string | null;
  status: FormStatus | null;
  panelChannelId: string | null;
  panelMessageId: string | null;
  panelEmoji: string | null;
  reviewChannelId: string | null;
  reviewerRoleIds: string[];
  reviewerPing: boolean;
  color: string | null;
  imageUrl: string | null;
  introMessage: string | null;
  confirmationMessage: string | null;
  acceptMessage: string | null;
  declineMessage: string | null;
  questions: FormQuestion[];
  cooldownMs: number | null;
  allowMultiple: boolean;
  maxSubmissions: number;
  dmApplicant: boolean;
  anonymous: boolean;
  requiredRoleIds: string[];
  createdBy: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface FormSubmissionCounts {
  [status: string]: number;
}

export interface FormSubmissionAnswer {
  questionId: string;
  value: string;
}

export interface FormSubmission {
  id: string;
  formId: string | null;
  guildId: string | null;
  userId: string | null;
  status: string | null;
  answers: FormSubmissionAnswer[];
  reviewerId: string | null;
  reason: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  submittedAt: number | null;
  reviewedAt: number | null;
}

export interface GuildFormDetail {
  form: GuildForm;
  submissionCounts: FormSubmissionCounts;
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
