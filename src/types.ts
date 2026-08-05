export interface CareerSettings {
  characterName: string;
  careerType: 'player' | 'manager';
  teamName: string;
  season: string;
  journalistId: string;
  customApiKey?: string;
  aiProvider?: 'gemini' | 'openai' | 'anthropic';
  openaiApiKey?: string;
  anthropicApiKey?: string;
  imgurClientId?: string;
  customWebhookUrl?: string;
}

export type EntryType = 'match' | 'transfer' | 'injury' | 'training' | 'award' | 'other';

export type MediaType = 'image' | 'video' | 'gallery' | 'html' | 'scratch';

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  month: string;
  season?: string;
  type: EntryType;
  mediaUrl?: string; // base64 representation of image or thumbnail
  mediaType?: MediaType;
  galleryUrls?: string[]; // Array of base64 images or URLs for image carousel
  htmlCode?: string; // Custom HTML snippet or Canvas presentation code
  scratchCoverText?: string; // Optional custom text for scratch card overlay (e.g. "RASPE PARA REVELAR O NOVO REFORÇO")
  videoUrl?: string; // local blob URL if video
  videoBlob?: Blob;  // native binary Blob for persistent offline storage
  videoRefPath?: string; // internal reference path for zip backup archives
  videoStartTime?: number; // Start time of video segment in seconds
  videoEndTime?: number;   // End time of video segment in seconds (max 20s from startTime)
  videoFrameTime?: number; // Timestamp in seconds where thumbnail frame was captured
  createdAt: number;
  sortOrder?: number;
}

export interface MagazinePage {
  pageNumber: number;
  title: string;
  content: string; // Markdown text
  caption?: string;
  suggestedEntryId?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  galleryUrls?: string[];
  htmlCode?: string;
  scratchCoverText?: string;
  videoUrl?: string | null;
  videoStartTime?: number;
  videoEndTime?: number;
}

export interface Magazine {
  id: string;
  title: string;
  subtitle: string;
  editorialText: string;
  journalistId: string;
  period: string;
  season?: string;
  pages: MagazinePage[];
  createdAt: number;
  coverImageUrl?: string;
}

export interface Journalist {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  styleDescription: string;
  tags: string[];
  catchphrase: string;
}

export const JOURNALISTS: Journalist[] = [
  {
    id: 'jorge-iggor',
    name: "Jorge Iggor",
    avatar: "🎙️",
    bio: "Narrador lendário da TNT Sports, mestre das noites mágicas de Champions League.",
    styleDescription: "Épico, extremamente emocional, poético e enérgico. Transforma cada partida em uma batalha heróica.",
    tags: ["Emoção Pura", "Noites Mágicas", "Épico"],
    catchphrase: "É DA CHAMPIONS! Incansável, espetacular!"
  },
  {
    id: 'pvc',
    name: "Paulo Vinícius Coelho (PVC)",
    avatar: "📊",
    bio: "Uma das mentes mais brilhantes e enciclopédicas do jornalismo esportivo brasileiro.",
    styleDescription: "Focado em números reais, táticas cirúrgicas, dados precisos e ricas analogias com o futebol do passado.",
    tags: ["Estatísticas", "História", "Prancheta"],
    catchphrase: "Olá, muito bem-vindo. Vamos aos números do jogo..."
  },
  {
    id: 'vsr',
    name: "Vitor Sergio Rodrigues (VSR)",
    avatar: "🧠",
    bio: "Comentarista da TNT Sports, conhecido por seus argumentos lógicos inabaláveis.",
    styleDescription: "Opiniões fortes, debate fundamentado, tática moderna (bloco, entrelinhas, amplitude) e foco absoluto no desempenho.",
    tags: ["Convicção", "Desempenho", "Análise Moderna"],
    catchphrase: "Com toda a convicção do mundo..."
  },
  {
    id: 'mauro-cezar',
    name: "Mauro Cezar Pereira",
    avatar: "⚖️",
    bio: "Jornalista independente de estilo marcante, reconhecido pela exigência e seriedade.",
    styleDescription: "Ácido, realista, direto e avesso ao 'oba-oba'. Detesta posse de bola inútil e cobra comprometimento tático total.",
    tags: ["Sem Filtro", "Exigente", "Tática Rígida"],
    catchphrase: "Uma análise fria, realista e sem oba-oba."
  },
  {
    id: 'rizek',
    name: "André Rizek",
    avatar: "✍️",
    bio: "Apresentador do Seleção SporTV e cronista de futebol refinado.",
    styleDescription: "Elegante, crônico, reflexivo e humanista. Foca no peso psicológico da camisa, na torcida e na poesia dos gramados.",
    tags: ["Crônica", "Reflexivo", "Poesia do Futebol"],
    catchphrase: "O futebol tem dessas místicas inexplicáveis..."
  },
  {
    id: 'beting',
    name: "Mauro Beting",
    avatar: "🌹",
    bio: "Cronista apaixonado, historiador do futebol e contador de histórias líricas.",
    styleDescription: "Poético, romântico, mestre de trocadilhos geniais e antíteses dramáticas sobre o amor à bola.",
    tags: ["Lírico", "Trocadilhos", "Romântico"],
    catchphrase: "A bola que não quis entrar, a rede que se rendeu..."
  },
  {
    id: 'galvao',
    name: "Galvão Bueno",
    avatar: "👑",
    bio: "A voz oficial das maiores conquistas do esporte brasileiro.",
    styleDescription: "Teatral, patriótico, emocionante e cheio de bordões clássicos. Fala diretamente com o leitor chamando-o de amigo.",
    tags: ["Lendário", "Bordões Clássicos", "Haja Coração"],
    catchphrase: "HAJA CORAÇÃO, AMIGO! Olha o que ele fez!"
  },
  {
    id: 'bruno-formiga',
    name: "Bruno Formiga",
    avatar: "🔥",
    bio: "Comentarista e criador de conteúdo da TNT Sports, especialista em recortes de desempenho e debates acalorados.",
    styleDescription: "Analítico, provocativo, provocando ideias com 'recortes da realidade', amostragens, tática de contexto e forte apelo ao debate.",
    tags: ["Recorte Tático", "Amostragem", "Debate Acalorado"],
    catchphrase: "Vamos ao recorte da realidade... É o seguinte:"
  },
  {
    id: 'nelson-rodrigues',
    name: "Nelson Rodrigues",
    avatar: "📜",
    bio: "O maior dramaturgo e cronista da história do futebol brasileiro. Pai do 'Complexo de Vira-Lata' e da 'Pátria de Chuteiras'.",
    styleDescription: "Visceral, hiperbólico, poético, metafísico e dramático. Trata o futebol como uma tragédia grega repleta de deuses, milagres e fúria.",
    tags: ["Pátria de Chuteiras", "Drama Épico", "Tragédia Grega"],
    catchphrase: "O futebol é a vida em 90 minutos de pura tragédia e glória!"
  }
];

export const MONTHS = [
  "Janeiro (Pré-temporada)",
  "Fevereiro",
  "Março",
  "Abril (Início de Temporada)",
  "Maio",
  "Junho",
  "Julho (Janela do Meio do Ano)",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro (Finais de Temporada)",
  "Dezembro (Férias/Pós-temporada)"
];
