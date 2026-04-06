export interface Poll {
  id: string;
  title: string;
  description: string;
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
  createdAt: string;
  endsAt: string;
  status: "active" | "ended";
  totalVotes: number;
  options: PollOption[];
  allowMultipleChoices: boolean;
  anonymous: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  emoji?: string;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  activePolls: number;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  addedAt: string;
}

export interface PollDraft {
  id: string;
  title: string;
  description: string;
  serverId: string;
  channelId: string;
  options: PollOption[];
  allowMultipleChoices: boolean;
  anonymous: boolean;
  createdAt: string;
}

export const mockModerators: User[] = [
  {
    id: "1",
    username: "admin_user",
    discriminator: "0001",
    avatar: "👤",
    addedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    username: "moderator_pro",
    discriminator: "1234",
    avatar: "👨‍💼",
    addedAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "3",
    username: "poll_master",
    discriminator: "5678",
    avatar: "👩‍💻",
    addedAt: "2026-03-10T09:15:00Z",
  },
];

export const mockSubscribers: User[] = [
  {
    id: "4",
    username: "premium_user",
    discriminator: "9999",
    avatar: "⭐",
    addedAt: "2026-01-05T08:00:00Z",
  },
  {
    id: "5",
    username: "vip_member",
    discriminator: "7777",
    avatar: "💎",
    addedAt: "2026-02-15T16:45:00Z",
  },
];

export const mockDrafts: PollDraft[] = [
  {
    id: "d1",
    title: "Próximo evento da comunidade",
    description: "Decidir qual será o próximo grande evento",
    serverId: "1",
    channelId: "ch1",
    createdAt: "2026-04-02T15:00:00Z",
    allowMultipleChoices: false,
    anonymous: false,
    options: [
      { id: "opt1", text: "Torneio de jogos", votes: 0, emoji: "🎮" },
      { id: "opt2", text: "Sessão de cinema", votes: 0, emoji: "🎬" },
      { id: "opt3", text: "Quiz trivia", votes: 0, emoji: "🧠" },
    ],
  },
  {
    id: "d2",
    title: "Melhorias no servidor",
    description: "O que vocês gostariam de ver implementado?",
    serverId: "1",
    channelId: "ch2",
    createdAt: "2026-04-01T11:30:00Z",
    allowMultipleChoices: true,
    anonymous: true,
    options: [
      { id: "opt1", text: "Mais canais de voz", votes: 0, emoji: "🔊" },
      { id: "opt2", text: "Novos bots", votes: 0, emoji: "🤖" },
      { id: "opt3", text: "Sistema de níveis", votes: 0, emoji: "📈" },
      { id: "opt4", text: "Eventos semanais", votes: 0, emoji: "📅" },
    ],
  },
];

export const mockServers: Server[] = [
  {
    id: "1",
    name: "Gaming Community",
    icon: "🎮",
    memberCount: 5420,
    activePolls: 3,
  },
  {
    id: "2",
    name: "Tech Discussions",
    icon: "💻",
    memberCount: 2830,
    activePolls: 2,
  },
  {
    id: "3",
    name: "Movie Club",
    icon: "🎬",
    memberCount: 1250,
    activePolls: 1,
  },
];

export const mockPolls: Poll[] = [
  {
    id: "1",
    title: "Qual jogo jogaremos hoje?",
    description: "Vamos decidir qual jogo jogar no evento de hoje à noite!",
    serverId: "1",
    serverName: "Gaming Community",
    channelId: "ch1",
    channelName: "general",
    createdAt: "2026-04-03T10:00:00Z",
    endsAt: "2026-04-03T20:00:00Z",
    status: "active",
    totalVotes: 156,
    allowMultipleChoices: false,
    anonymous: false,
    options: [
      { id: "opt1", text: "Valorant", votes: 68, emoji: "🎯" },
      { id: "opt2", text: "League of Legends", votes: 52, emoji: "⚔️" },
      { id: "opt3", text: "CS:GO", votes: 36, emoji: "🔫" },
    ],
  },
  {
    id: "2",
    title: "Horário preferido para eventos",
    description: "Quando seria melhor para vocês participarem dos eventos?",
    serverId: "1",
    serverName: "Gaming Community",
    channelId: "ch2",
    channelName: "eventos",
    createdAt: "2026-04-02T14:30:00Z",
    endsAt: "2026-04-05T23:59:00Z",
    status: "active",
    totalVotes: 243,
    allowMultipleChoices: true,
    anonymous: true,
    options: [
      { id: "opt1", text: "Manhã (8h-12h)", votes: 45, emoji: "🌅" },
      { id: "opt2", text: "Tarde (12h-18h)", votes: 89, emoji: "☀️" },
      { id: "opt3", text: "Noite (18h-23h)", votes: 187, emoji: "🌙" },
      { id: "opt4", text: "Madrugada (23h-6h)", votes: 32, emoji: "🌃" },
    ],
  },
  {
    id: "3",
    title: "Melhor linguagem de programação",
    description: "Qual linguagem você mais gosta de usar?",
    serverId: "2",
    serverName: "Tech Discussions",
    channelId: "ch3",
    channelName: "debates",
    createdAt: "2026-04-01T09:00:00Z",
    endsAt: "2026-04-04T18:00:00Z",
    status: "active",
    totalVotes: 312,
    allowMultipleChoices: false,
    anonymous: false,
    options: [
      { id: "opt1", text: "JavaScript", votes: 98, emoji: "💛" },
      { id: "opt2", text: "Python", votes: 124, emoji: "🐍" },
      { id: "opt3", text: "Rust", votes: 56, emoji: "🦀" },
      { id: "opt4", text: "Go", votes: 34, emoji: "🔷" },
    ],
  },
  {
    id: "4",
    title: "Filme para assistir na sexta",
    description: "Escolha o filme para nossa sessão de cinema!",
    serverId: "3",
    serverName: "Movie Club",
    channelId: "ch4",
    channelName: "votação",
    createdAt: "2026-03-31T16:00:00Z",
    endsAt: "2026-04-04T12:00:00Z",
    status: "active",
    totalVotes: 87,
    allowMultipleChoices: false,
    anonymous: false,
    options: [
      { id: "opt1", text: "Oppenheimer", votes: 34, emoji: "💥" },
      { id: "opt2", text: "Barbie", votes: 28, emoji: "💖" },
      { id: "opt3", text: "Dune 2", votes: 25, emoji: "🏜️" },
    ],
  },
  {
    id: "5",
    title: "Sistema operacional favorito",
    description: "Qual sistema operacional você usa no dia a dia?",
    serverId: "2",
    serverName: "Tech Discussions",
    channelId: "ch5",
    channelName: "tech-talk",
    createdAt: "2026-03-28T11:00:00Z",
    endsAt: "2026-03-30T23:59:00Z",
    status: "ended",
    totalVotes: 445,
    allowMultipleChoices: false,
    anonymous: false,
    options: [
      { id: "opt1", text: "Windows", votes: 198, emoji: "🪟" },
      { id: "opt2", text: "macOS", votes: 112, emoji: "🍎" },
      { id: "opt3", text: "Linux", votes: 135, emoji: "🐧" },
    ],
  },
  {
    id: "6",
    title: "Dia da semana para campeonato",
    description: "Qual o melhor dia para o campeonato mensal?",
    serverId: "1",
    serverName: "Gaming Community",
    channelId: "ch6",
    channelName: "competitivo",
    createdAt: "2026-03-25T10:00:00Z",
    endsAt: "2026-03-28T20:00:00Z",
    status: "ended",
    totalVotes: 567,
    allowMultipleChoices: false,
    anonymous: true,
    options: [
      { id: "opt1", text: "Sábado", votes: 345, emoji: "📅" },
      { id: "opt2", text: "Domingo", votes: 222, emoji: "📆" },
    ],
  },
];

export const getActivePolls = () => mockPolls.filter((p) => p.status === "active");
export const getEndedPolls = () => mockPolls.filter((p) => p.status === "ended");
export const getPollById = (id: string) => mockPolls.find((p) => p.id === id);