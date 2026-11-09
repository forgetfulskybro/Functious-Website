const BOT_API_URL = process.env.BOT_API_URL;
const BOT_API_KEY = process.env.BOT_API_KEY ?? "";

export class BotApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BotApiError';
    this.status = status;
  }
}

async function botRequest(path: string, options: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${BOT_API_URL}${path}`, options);
  } catch {
    throw new Error('Bot is currently offline or unreachable.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new BotApiError(
      (data as { error?: string }).error || `Bot API error ${res.status}`,
      res.status,
    );
  }

  return res.json();
}

function botHeaders(userId?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": BOT_API_KEY,
    "x-user-id": userId ?? "",
  };
}

async function safeFetch(url: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Bot is currently offline or unreachable.');
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Bot API error ${res.status}`);
    }
    throw new Error(`Bot API error ${res.status}: ${res.statusText}`);
  }

  return res;
}

export async function filterBotGuilds(guildIds: string[]): Promise<string[]> {
  try {
    const res = await safeFetch(`${BOT_API_URL}/api/guilds/filter`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({ guildIds }),
      cache: 'no-store',
    });
    const data = await res.json();
    return data.present ?? [];
  } catch {
    return [];
  }
}

export async function getBotGuild(guildId: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export function emptyGuildData(guildId: string) {
  return {
    id: guildId,
    name: null,
    icon: null,
    owner_id: null,
    prefix: '!',
    language: 'en_EN',
    dm: false,
    pollPerm: true,
    emojis: [],
    timezoneConvert: false,
    stickyRolesEnabled: false,
    roles: [],
    joinRoles: [],
    stickyRoles: [],
    bypassRoles: [],
    timedRoles: [],
    tags: [],
    tagTriggerBots: false,
    scheduledMessages: [],
    stickies: [],
    commandSettings: [],
    commandCatalog: [],
    mediaChannels: [],
    userTimezones: [],
    parentChannel: null,
    childChannel: null,
    tempChannels: [],
    config: {
      channelName: null,
      channelLimit: null,
      counting: false,
      customParent: null,
      manage: null,
      manageMessage: null,
      managevc: false,
    },
    guildChannels: [],
    guildRoles: [],
    activePolls: [],
    activeGiveaways: [],
    birthdayChannel: null,
    birthdayRole: null,
    birthdayPing: true,
    birthdayBlacklist: [],
    birthdayMessageWithAge: null,
    birthdayMessageNoAge: null,
    communityBirthday: null,
  };
}

export async function updateBotGuild(
  guildId: string,
  updates: Record<string, unknown>,
  userId?: string,
) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}`, {
    method: "PATCH",
    headers: botHeaders(userId),
    body: JSON.stringify(updates),
    cache: "no-store",
  });
  return res.json();
}

export async function getBotPolls(guildId: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/polls`, {
    headers: botHeaders(),
    cache: 'no-store',
  });
  return res.json();
}

export async function createBotPoll(
  guildId: string,
  body: {
    channelId: string;
    question: string;
    duration: string;
    options: string[];
    thread?: boolean;
    ownerId?: string;
  },
  userId?: string
) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/polls`, {
    method: 'POST',
    headers: botHeaders(userId),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return res.json();
}

export async function deleteBotPoll(guildId: string, messageId: string, userId?: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/polls/${messageId}`, {
    method: 'DELETE',
    headers: botHeaders(userId),
    cache: 'no-store',
  });
  return res.json();
}

export async function createBotGiveaway(
  guildId: string,
  body: {
    channelId: string;
    prize: string;
    winners: number;
    duration: string;
    requirement?: string | null;
    ownerId?: string;
  },
  userId?: string
) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/giveaways`,
    {
      method: "POST",
      headers: botHeaders(userId),
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function deleteBotGiveaway(guildId: string, messageId: string, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/giveaways/${messageId}`,
    {
      method: "DELETE",
      headers: botHeaders(userId),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function getBotGiveaways(guildId: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/giveaways`,
    {
      headers: botHeaders(),
      cache: "no-store",
    },
  );
  return res.json();
}

export async function deleteReactionRoles(guildId: string, messageId: string, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}`,
    {
      method: "DELETE",
      headers: botHeaders(userId),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function exclusiveReactionRoles(guildId: string, messageId: string, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}/exclusive`,
    {
      method: "POST",
      headers: botHeaders(userId),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function updateReactionRoles(guildId: string, messageId: string, data: any, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}`,
    {
      method: "PATCH",
      headers: botHeaders(userId),
      body: JSON.stringify(data),
      cache: "no-store",
    },
  );
  const result = await res.json();
  return result;
}

export async function fetchReactionRoles(guildId: string, messageId: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}`,
    { 
      headers: botHeaders(),
      cache: "no-store",
    }
  );
  const data = await res.json();
  return data;
}

export async function createReactionRoles(guildId: string, data: any, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/`,
    {
      method: "POST",
      headers: botHeaders(userId),
      body: JSON.stringify(data),
      cache: "no-store",
    },
  );
  const result = await res.json();
  return result;
}

export async function updateBotTheme(guildId: string, color: string, userId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/theme`,
    {
      method: 'POST',
      headers: botHeaders(userId),
      body: JSON.stringify({ color, userId }),
      cache: 'no-store',
    },
  );
  

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Bot API responded ${res.status}`);
  }
  return res.json();
}

export async function setupTempChannels(
  guildId: string,
  options: {
    customCategoryId?: string | null;
    manage?: boolean;
    managevc?: boolean;
    channelName?: string;
    channelLimit?: number;
    counting?: boolean;
    reset?: boolean;
  } = {},
  userId?: string
) {
  const res = await fetch(
    `${BOT_API_URL}/api/guilds/${guildId}/tempchannels/setup`,
    {
      method: "POST",
      headers: botHeaders(userId),
      body: JSON.stringify(options),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || `Setup failed (${res.status})`,
    );
  }

  return res.json();
}

export async function resetTempChannels(guildId: string, userId?: string) {
  const res = await fetch(
    `${BOT_API_URL}/api/guilds/${guildId}/tempchannels/reset`,
    {
      method: "POST",
      headers: botHeaders(userId),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || `Reset failed (${res.status})`,
    );
  }

  return res.json();
}

export async function getBotHealth() {
  const res = await safeFetch(`${BOT_API_URL}/health`, {
    cache: "no-store",
  });
  return res.json();
}

export async function runBotCheckup(guildId: string) {
  return botRequest(`/api/guilds/${guildId}/checkup`, {
    method: 'POST',
    headers: botHeaders(),
    cache: 'no-store',
  });
}

export async function getUserReminders() {
  const res = await safeFetch(`${BOT_API_URL}/api/reminders`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export async function getBotGuildBirthdays(guildId: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/birthdays`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export async function forceBotBirthday(guildId: string, userId: string, actorUserId?: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/birthdays/force`, {
    method: "POST",
    headers: botHeaders(actorUserId),
    body: JSON.stringify({ userId }),
    cache: "no-store",
  });
  return res.json();
}

export async function addBirthdayBlacklist(guildId: string, userId: string, actorUserId?: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/birthdays/blacklist`, {
    method: "POST",
    headers: botHeaders(actorUserId),
    body: JSON.stringify({ userId }),
    cache: "no-store",
  });
  return res.json();
}

export async function removeBirthdayBlacklist(guildId: string, userId: string, actorUserId?: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/birthdays/blacklist/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: botHeaders(actorUserId),
      cache: "no-store",
    },
  );
  return res.json();
}

export async function searchBotGuildMembers(guildId: string, query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/members${qs}`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export async function getBotEvents(guildId: string, filter = 'upcoming') {
  return botRequest(
    `/api/guilds/${guildId}/events?filter=${encodeURIComponent(filter)}`,
    { headers: botHeaders(), cache: 'no-store' },
  );
}

export async function createBotEvent(
  guildId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/events`, {
    method: 'POST',
    headers: botHeaders(userId),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function getBotEvent(guildId: string, eventId: string) {
  return botRequest(`/api/guilds/${guildId}/events/${encodeURIComponent(eventId)}`, {
    headers: botHeaders(),
    cache: 'no-store',
  });
}

export async function updateBotEvent(
  guildId: string,
  eventId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: botHeaders(userId),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function deleteBotEvent(
  guildId: string,
  eventId: string,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: botHeaders(userId),
    cache: 'no-store',
  });
}

export async function getBotForms(guildId: string) {
  return botRequest(`/api/guilds/${guildId}/forms`, {
    headers: botHeaders(),
    cache: 'no-store',
  });
}

export async function createBotForm(
  guildId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/forms`, {
    method: 'POST',
    headers: botHeaders(userId),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function getBotForm(guildId: string, formId: string) {
  return botRequest(`/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}`, {
    headers: botHeaders(),
    cache: 'no-store',
  });
}

export async function updateBotForm(
  guildId: string,
  formId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}`, {
    method: 'PATCH',
    headers: botHeaders(userId),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function deleteBotForm(
  guildId: string,
  formId: string,
  userId?: string,
) {
  return botRequest(`/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}`, {
    method: 'DELETE',
    headers: botHeaders(userId),
    cache: 'no-store',
  });
}

export async function getBotFormSubmissions(
  guildId: string,
  formId: string,
  status = 'all',
) {
  return botRequest(
    `/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}/submissions?status=${encodeURIComponent(status)}`,
    { headers: botHeaders(), cache: 'no-store' },
  );
}

export async function updateBotFormSubmission(
  guildId: string,
  formId: string,
  submissionId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(
    `/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
    {
      method: 'PATCH',
      headers: botHeaders(userId),
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );
}

export async function deleteBotFormSubmission(
  guildId: string,
  formId: string,
  submissionId: string,
  userId?: string,
) {
  return botRequest(
    `/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
    {
      method: 'DELETE',
      headers: botHeaders(userId),
      cache: 'no-store',
    },
  );
}

export async function publishBotForm(
  guildId: string,
  formId: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  return botRequest(
    `/api/guilds/${guildId}/forms/${encodeURIComponent(formId)}/publish`,
    {
      method: 'POST',
      headers: botHeaders(userId),
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );
}

export async function getBotUserProfiles(ids: string[]) {
  const res = await safeFetch(`${BOT_API_URL}/api/users/profiles`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({ ids }),
    cache: "no-store",
  });
  return res.json();
}
