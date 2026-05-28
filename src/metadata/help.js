// Static help content about Collabor8r features. Shown on the Help page and in the GuideSheet.

export const HELP_GUIDES = [
  {
    id: "projects",
    title: "Start a project",
    icon: "project",
    summary: "Create an organization project or a private personal project, then invite people.",
    steps: [
      "Open Projects and choose New project.",
      "Pick an organization, or create a personal project that only you can see.",
      "Invite people from the project People page. Roles control what each person can change.",
    ],
  },
  {
    id: "issues",
    title: "Track issues",
    icon: "task",
    summary: "Issues hold the work: type, summary, description, assignee, priority and due date.",
    steps: [
      "Create an issue with the New issue button or from search.",
      "Open an issue to edit fields, comment, log work and link related issues.",
      "Move an issue through the workflow with its status control.",
    ],
  },
  {
    id: "board",
    title: "Work on the board",
    icon: "kanban",
    summary: "The board shows issues as cards in columns that match the workflow statuses.",
    steps: [
      "Long-press a card and choose Move to, to change its status.",
      "Use the column plus button to create an issue in that status.",
      "Lead and admin roles can change the columns and quick filters in board settings.",
    ],
  },
  {
    id: "backlog",
    title: "Plan sprints",
    icon: "backlog",
    summary: "The backlog holds unplanned issues. Sprints group the work for a time box.",
    steps: [
      "Rank issues in the backlog to set the order of work.",
      "Move issues into a sprint, then start it.",
      "Complete a sprint to move unfinished issues back to the backlog or to the next sprint.",
    ],
  },
  {
    id: "wiki",
    title: "Write wiki pages",
    icon: "wiki",
    summary: "Wiki pages hold specs, notes and decisions in Markdown, with a history of versions.",
    steps: [
      "Create a page from the wiki and write in Markdown with the toolbar.",
      "Use Preview to check the rendered page before you save.",
      "Open History to compare versions and restore an earlier one.",
    ],
  },
  {
    id: "notifications",
    title: "Stay informed",
    icon: "bell",
    summary: "Notifications tell you about mentions, assignments and changes to issues you follow.",
    steps: [
      "Open the bell to see unread notifications and mark them read.",
      "Choose which kinds of notification you get, and on which channel, in Settings.",
      "Switch the density or theme in Settings to match how you work.",
    ],
  },
];

export const HELP_FAQ = [
  {
    id: "roles",
    q: "What can each project role do?",
    a: "Viewers read the project. Reporters create issues and comments. Developers edit and move issues. Leads manage boards, sprints and releases. Admins also manage people, roles, workflows and automation.",
  },
  {
    id: "version",
    q: "Why did my change say the issue was updated by someone else?",
    a: "Issues carry a version number. If someone saved the issue after you opened it, your save is stopped so nothing is overwritten. Reload the issue, check the new values and apply your change again.",
  },
  {
    id: "sign-out",
    q: "How do I sign out of every device?",
    a: "Open Settings, then Security, and choose Sign out everywhere. Your current session also ends.",
  },
  {
    id: "api-tokens",
    q: "Can I use Collabor8r from scripts?",
    a: "Yes. Create a personal API token in Settings, then Security, with the scopes it needs. The token is shown once, so copy it when it appears.",
  },
  {
    id: "ai",
    q: "What does the AI button do?",
    a: "It drafts an issue from text, suggests subtasks, summarizes an issue or outlines a wiki page. Drafts are shown for review, and nothing is created until you accept one.",
  },
  {
    id: "attachments",
    q: "Why can't I upload a file?",
    a: "File uploads need storage on the server. If it is not configured, the attachment area shows the files but disables upload.",
  },
  {
    id: "compact",
    q: "How do I fit more rows on screen?",
    a: "Open Settings, then Appearance, and choose Compact density. The setting stays on this device.",
  },
];
