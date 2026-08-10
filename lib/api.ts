const BOT_API_URL = process.env.BOT_API_URL;
const BOT_API_KEY = process.env.BOT_API_KEY ?? "";

function botHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": BOT_API_KEY,
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
    emojis: [],
    timezoneConvert: false,
    stickyRolesEnabled: false,
    roles: [],
    joinRoles: [],
    stickyRoles: [],
    bypassRoles: [],
    timedRoles: [],
    tags: [],
    scheduledMessages: [],
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
    },
    guildChannels: [],
    guildRoles: [],
    activePolls: [],
    activeGiveaways: [],
  };
}

export async function updateBotGuild(
  guildId: string,
  updates: Record<string, unknown>,
) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}`, {
    method: "PATCH",
    headers: botHeaders(),
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
    ownerId?: string;
  }
) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/polls`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return res.json();
}

export async function deleteBotPoll(guildId: string, messageId: string) {
  const res = await safeFetch(`${BOT_API_URL}/api/guilds/${guildId}/polls/${messageId}`, {
    method: 'DELETE',
    headers: botHeaders(),
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
) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/giveaways`,
    {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function deleteBotGiveaway(guildId: string, messageId: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/giveaways/${messageId}`,
    {
      method: "DELETE",
      headers: botHeaders(),
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

export async function deleteReactionRoles(guildId: string, messageId: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}`,
    {
      method: "DELETE",
      headers: botHeaders(),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function exclusiveReactionRoles(guildId: string, messageId: string) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}/exclusive`,
    {
      method: "POST",
      headers: botHeaders(),
      cache: "no-store",
    },
  );
  const data = await res.json();
  return data;
}

export async function updateReactionRoles(guildId: string, messageId: string, data: any) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/${messageId}`,
    {
      method: "PATCH",
      headers: botHeaders(),
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

export async function createReactionRoles(guildId: string, data: any) {
  const res = await safeFetch(
    `${BOT_API_URL}/api/guilds/${guildId}/reactionroles/`,
    {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify(data),
      cache: "no-store",
    },
  );
  const result = await res.json();
  return result;
}

export async function setupTempChannels(
  guildId: string,
  options: {
    customCategoryId?: string | null;
    manage?: boolean;
    channelName?: string;
    channelLimit?: number;
    counting?: boolean;
    reset?: boolean;
  } = {},
) {
  const res = await fetch(
    `${BOT_API_URL}/api/guilds/${guildId}/tempchannels/setup`,
    {
      method: "POST",
      headers: botHeaders(),
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

export async function resetTempChannels(guildId: string) {
  const res = await fetch(
    `${BOT_API_URL}/api/guilds/${guildId}/tempchannels/reset`,
    {
      method: "POST",
      headers: botHeaders(),
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

export async function getBotStats() {
  const res = await safeFetch(`${BOT_API_URL}/api/stats`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export async function getBotHistoricalStats() {
  const res = await safeFetch(`${BOT_API_URL}/api/stats/history`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}

export async function getBotHistoricalHealth() {
  const res = await safeFetch(`${BOT_API_URL}/health/history`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getUserReminders() {
  const res = await safeFetch(`${BOT_API_URL}/api/reminders`, {
    headers: botHeaders(),
    cache: "no-store",
  });
  return res.json();
}
