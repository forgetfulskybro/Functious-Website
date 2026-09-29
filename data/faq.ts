export interface FaqItem {
  question: string;
  answer: string;
  featured?: boolean;
}

export interface FaqGroup {
  id: string;
  command: string;
  title: string;
  tagline: string;
  items: FaqItem[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'autoroles',
    command: 'f!autoroles',
    title: 'Auto Roles',
    tagline: 'Give members roles automatically as they join or stay.',
    items: [
      {
        question: 'Will members keep their roles if they leave and rejoin?',
        answer:
          "Yes, with sticky roles. Sticky roles save a member's roles when they leave the community and restore them automatically if they come back. Enable them for your community with `f!autoroles sticky`.",
        featured: true,
      },
    ],
  },
  {
    id: 'birthday',
    command: 'f!birthday',
    title: 'Birthdays',
    tagline: 'Store a date once and announce it automatically. Also called f!bday.',
    items: [
      {
        question: 'Why was I not announced after setting my birthday?',
        answer:
          'Setting a date only saves it to your account, it does not publish it anywhere. You also need to turn it on for each community with `f!bday enable`, then repeat that in any other community where you want announcements.',
        featured: true,
      },
      {
        question: 'What formats can I type my birthday in?',
        answer:
          'All of `12th of June`, `the 1st of June`, `June 12`, and numeric forms like `6/12` or `12/6` work. Ordinal endings and the words "the" and "of" are ignored. If a numeric date could be read either way, the bot tells you which reading it chose, so use `f!bday edit <date>` if it guessed wrong.',
      },
      {
        question: 'Why was my birthday announced at the wrong time?',
        answer:
          'Announcements go out at midnight in your own timezone, taken from your profile. If you have not set one the bot falls back to UTC, so run `f!timezone set <IANA timezone>`, for example `f!timezone set America/New_York`, and your birthday will follow it.',
      },
      {
        question: 'Why did my birthday role only last one day?',
        answer:
          'That is on purpose. A role set with `f!bday role <@role>` is given when the announcement is posted and then removed 24 hours later, so it does not become a permanent badge. Run the same command to change which role is used.',
      },
      {
        question: 'Can I keep my age private?',
        answer:
          'Yes, the age is optional. Leave it unset and the announcement falls back to a plain birthday message. Set it with `f!bday age <number>` and the bot announces the next one, such as a 31st birthday. Clear it again with `f!bday age remove`.',
      },
      {
        question: 'How do I turn my birthday on in more than one community?',
        answer:
          'Run `f!bday enable` in each community you want it announced in. `f!bday servers` lists everywhere it is currently on, and `f!bday disable` turns it off for the community you are in.',
      },
      {
        question: 'Can I be removed from announcements but keep my date saved?',
        answer:
          'Community staff can do this for you by adding you to the community blacklist, which immediately opts you out of that community and stops the announcement without deleting your date. If you would rather remove the date entirely, use `f!bday remove` yourself.',
      },
      {
        question: 'Can I change what the announcement says?',
        answer:
          'Yes. Use `f!bday message withage <text>` for members who set an age and `f!bday message noage <text>` for those who did not. The words `{user}` and `{age}` work as placeholders, and `f!bday message reset` puts the defaults back.',
      },
      {
        question: 'Can I preview a birthday or send one early?',
        answer:
          '`f!bday preview` shows you the exact announcement without posting it to the channel. Staff can post one early for any member with `f!bday force <@user>`, and check what is coming with `f!bday list` and `f!bday settings`.',
      },
    ],
  },
  {
    id: 'bypass',
    command: 'f!bypass',
    title: 'Bypass Roles',
    tagline: 'Give roles access to commands without raising their permissions.',
    items: [
      {
        question: 'How do I let moderators use commands without giving them admin?',
        answer:
          'Bypass grants specific roles access to permission-locked commands without changing their community permissions. Use `f!bypass add <role> <commands>` for particular commands, or `f!bypass add <role> all` for every one.',
        featured: true,
      },
    ],
  },
  {
    id: 'mediachannels',
    command: 'f!mediachannels',
    title: 'Media Channels',
    tagline: 'Restrict channels to media or links. Also called f!mc.',
    items: [
      {
        question: 'Why was my message deleted without any warning?',
        answer:
          'That is how media channels work. Anything in the channel that is not an allowed attachment or link is removed quietly and the sender is not told, which keeps the channel clean without anyone running a moderation command. Set the channel up with `f!mc add` so members know what to post.',
        featured: true,
      },
      {
        question: 'Why was my message deleted when it had an image in it?',
        answer:
          'Every attachment in a message has to pass the rules, so one allowed image next to one disallowed file is enough for the whole message to be removed. Loosen the rules with `f!mc edit <#channel>`, using the same options as add.',
      },
      {
        question: 'What do the different content type options do?',
        answer:
          '`--attachments` allows any attachment and is the default when you pass no options. `--images` covers png, jpg, jpeg, gif, webp, bmp, tiff and avif. `--videos` covers mp4, mov, webm, mkv, avi, wmv, flv and m4v. `--files` allows everything else, such as zip, pdf or txt. `--links` allows plain links with no attachment. Combine them freely, but using any specific option turns off the broad default unless you also add `--attachments`.',
      },
      {
        question: 'How does the rating and auto-delete option work?',
        answer:
          '`--rating` adds up and down reactions to every post so members can vote on it. `--delete <number>` sets how far the downvotes have to outweigh the upvotes before the post is removed on its own, so `--delete 3` removes a post once downvotes are ahead by 3.',
      },
      {
        question: 'What does the sticky message option do?',
        answer:
          '`--sticky` posts a short reminder a few seconds after each new upload and replaces the previous one, so only a single reminder is ever visible. Add `--stickytext <text>` to use your own wording, or leave it out and Functious writes a default based on the content types you allowed.',
      },
      {
        question: 'Do members need any permission to post in a media channel?',
        answer:
          'No. Only setting one up needs Manage Guild. Anyone who can post normally still can, their message just has to match the rules you configured.',
      },
      {
        question: 'How do I check or change the channels I have set up?',
        answer:
          '`f!mc list` shows every configured channel along with its active options, `f!mc edit <#channel>` changes one using the same options as add, and `f!mc remove <#channel>` stops enforcing the rules there.',
      },
    ],
  },
  {
    id: 'remind',
    command: 'f!remind',
    title: 'Reminders',
    tagline: 'Set a personal reminder for yourself.',
    items: [
      {
        question: 'How do I set a reminder for a specific time?',
        answer:
          'Both styles work. You can use plain language like "tomorrow at 5pm" or "in 30 minutes", or short form like `1h30m`, `2d`, or `5m`. Add `dm` before the time to have it sent to you privately instead of in the channel.',
      },
    ],
  },
  {
    id: 'roles',
    command: 'f!roles',
    title: 'Reaction Roles',
    tagline: 'Let members give themselves roles by reacting.',
    items: [
      {
        question: 'Can a member only have one role from a reaction panel?',
        answer:
          'Yes, that is what exclusive mode does. Turn it on with `f!roles exclusive <messageId>` and members will only be able to hold one role from that reaction message at a time, swapping between them as they react.',
        featured: true,
      },
    ],
  },
  {
    id: 'schedule',
    command: 'f!schedule',
    title: 'Scheduled Messages',
    tagline: 'Send a message, poll, giveaway, or reminder later.',
    items: [
      {
        question: 'Can I schedule a message to send more than once?',
        answer:
          'Yes. When you set up a scheduled message you can choose `daily`, `weekly`, `monthly`, or a custom cron expression, and Functious will keep sending it on that repeat.',
        featured: true,
      },
    ],
  },
];

export const FEATURED_FAQ: FaqItem[] = FAQ_GROUPS.flatMap((group) =>
  group.items.filter((item) => item.featured)
);
