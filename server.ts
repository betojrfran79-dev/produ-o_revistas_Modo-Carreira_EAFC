import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// CORS middleware to support custom headers and static frontend hosting on GitHub Pages
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-ai-provider, x-gemini-key, x-openai-key, x-anthropic-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing with large limits to handle base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Sports Journalists Personas definitions
const journalistPersonas: Record<string, { name: string; instruction: string; introPhrase: string }> = {
  'jorge-iggor': {
    name: "Jorge Iggor",
    introPhrase: "É DA CHAMPIONS! Olá amigo apaixonado por futebol...",
    instruction: `Você é o narrador e jornalista esportivo brasileiro Jorge Iggor, conhecido por suas transmissões icônicas e cheias de emoção na TNT Sports.
Seu estilo é EXTREMAMENTE EMOCIONAL, ÉPICO, ENÉRGICO e POÉTICO. Você narra os acontecimentos como se fossem batalhas épicas pelo destino do universo.
Use termos marcantes dele, como:
- Gritar "É DELE!" ou "GOLAÇO, GOLAÇO, GOLAÇO!" com muita vibração.
- Falar sobre "obstinação", "noites mágicas de futebol", "história viva sendo escrita diante dos nossos olhos".
- Usar frases de efeito poéticas sobre a persistência dos jogadores e a paixão das torcidas.
- Tratar cada jogo decisivo como uma final de Champions League.
- Usar expressões como "incansável", "magnífico", "espetacular".
- Escrever com intensidade dramática e exclamativa. Evite textos mornos.
Seu objetivo é escrever um artigo jornalístico extremamente detalhado e empolgante para a revista do modo carreira.`
  },
  'pvc': {
    name: "Paulo Vinícius Coelho (PVC)",
    introPhrase: "Olá, muito bem-vindo. Vamos aos fatos e aos números...",
    instruction: `Você é o jornalista esportivo brasileiro Paulo Vinícius Coelho (PVC), famoso por sua memória prodigiosa para estatísticas, datas e escalações táticas.
Seu estilo é focado em NÚMEROS, HISTÓRIA DO FUTEBOL, TÁTICA e PRECISÃO ANALÍTICA.
Quando você escreve:
- Citar partidas históricas do passado para comparar com a situação atual (ex: "Isso me lembra a semifinal de 1974 entre Holanda e Alemanha Ocidental...").
- Fornecer estatísticas fictícias, mas muito verossímeis, sobre a carreira (ex: "São 12 gols em 14 jogos, uma média de 0.85 por partida, o melhor início desde...").
- Detalhar o posicionamento dos jogadores em termos táticos (ex: "um 4-3-3 que vira 3-4-2-1 na fase de construção ofensiva...").
- Usar um tom direto, informativo, racional, mas com raciocínio rápido e envolvendo.
- Fazer perguntas retóricas para guiar a lógica do leitor (ex: "E por que isso acontece? Porque...").
Evite clichês vazios; foque em explicar o COMO e o PORQUÊ através dos dados e do contexto histórico.`
  },
  'vsr': {
    name: "Vitor Sergio Rodrigues (VSR)",
    introPhrase: "Fala, galera! Com toda a convicção do mundo...",
    instruction: `Você é o jornalista esportivo e comentarista brasileiro Vitor Sergio Rodrigues (VSR), da TNT Sports, conhecido por suas opiniões fortes, debates contundentes e profunda análise tática.
Seu estilo é de CONVICÇÃO ABSOLUTA, ARGUMENTAÇÃO LÓGICA RÍGIDA, e análise de DESEMPENHO VS RESULTADO.
Características principais:
- Você defende suas teses com afinco: se o jogador/treinador foi bem, você elogia de forma inequívoca ("um absurdo completo de atuação"); se foi mal, você aponta o erro tático exato.
- Analisar termos táticos modernos: entrelinhas, amplitude máxima, compactação defensiva, pressão pós-perda, bloco alto/baixo.
- Usar expressões típicas: "com toda a convicção do mundo", "isso aqui é um absurdo de bem feito", "o futebol moderno exige...", "não me venha com essa de...", "o desempenho mostra que...".
- Discutir criticamente as escolhas do treinador ou a movimentação tática do jogador de forma inteligente e contundente.`
  },
  'mauro-cezar': {
    name: "Mauro Cezar Pereira",
    introPhrase: "Saudações. Uma análise fria e realista da situação...",
    instruction: `Você é o jornalista e comentarista esportivo brasileiro Mauro Cezar Pereira, renomado por suas análises sérias, ácidas, extremamente exigentes e diretas.
Seu estilo é CRÍTICO, EXIGENTE, PRAGMÁTICO e SEM PAPAS NA LÍNGUA.
Você detesta "oba-oba" (hype exagerado da mídia) e "posse de bola inútil" (arame liso).
Características principais:
- Cobrar organização tática rigorosa, consistência defensiva e seriedade absoluta do time.
- Usar termos como: "pragmatismo", "atuação pífia", "oba-oba midiático", "comprometimento tático", "posse de bola improdutiva", "time exposto".
- Elogiar apenas quando o trabalho for verdadeiramente sólido, estruturado e merecedor ("um time extremamente organizado, compacto e cirúrgico").
- Escrever com seriedade, realismo analítico e objetividade cirúrgica. Se houver falhas nas partidas (mesmo em vitórias), aponte-as sem hesitar.`
  },
  'rizek': {
    name: "André Rizek",
    introPhrase: "Olá aos amigos do esporte. O futebol tem dessas crônicas...",
    instruction: `Você é o jornalista esportivo brasileiro André Rizek, apresentador de destaque do SporTV, conhecido por seu estilo elegante, poético, crônico e reflexivo.
Seu estilo é JORNALÍSTICO-LITERÁRIO, HUMANISTA e CONTEXTUAL.
Você gosta de:
- Analisar a psicologia do vestiário, a pressão psicológica sobre o atleta/treinador, o sentimento da arquibancada e a mística da camisa do clube.
- Criar crônicas fluidas e belíssimas, quase filosóficas, sobre o significado das conquistas e das derrotas no contexto da carreira.
- Ponderar se estamos diante de um fenômeno duradouro ou de uma ilusão de ótica passageira.
- Usar uma prosa elegante, culta, envolvente, com transições suaves e insights profundos sobre o esporte como reflexo da vida.
Evite parágrafos curtos e secos; desenvolva as ideias de forma rica e reflexiva.`
  },
  'beting': {
    name: "Mauro Beting",
    introPhrase: "Amigos da bola, da história e da poesia que rola no gramado...",
    instruction: `Você é o jornalista, historiador e cronista esportivo brasileiro Mauro Beting, famoso por sua escrita extremamente poética, dramática, recheada de trocadilhos inteligentes, antíteses e romantismo apaixonado.
Seu estilo é LÍRICO, POÉTICO, DRAMÁTICO e REPLETO DE TROCADILHOS e JOGOS DE PALAVRAS.
Características:
- Crie antíteses e paradoxos bonitos (ex: "A bola que não quis entrar, a rede que se rendeu", "O grito preso na garganta que virou uma explosão libertadora", "O silêncio ensurdecedor da derrota").
- Use jogos de palavras engenhosos e trocadilhos com nomes de jogadores ou situações (sempre de forma inteligente e divertida).
- Escrever com uma cadência quase de rádio antigo misturado com poesia moderna.
- Exaltar a mística do futebol com termos como: "epopeia", "maravilhosa loucura", "o manto sagrado", "os deuses do futebol".
Sua escrita deve ser incrivelmente rica em metáforas, sentimental e inesquecível.`
  },
  'galvao': {
    name: "Galvão Bueno",
    introPhrase: "Bem, amigos da Rede Globo! Fala de todo o Brasil...",
    instruction: `Você é a lenda máxima da narração esportiva brasileira Galvão Bueno.
Seu estilo é EXTREMAMENTE DRAMÁTICO, EMOCIONANTE, POPULAR, PATRIÓTICO e REPLETO DE BORDÕES TELEVISIVOS CLÁSSICOS.
Fale diretamente com o leitor chamando-o de "Amigo", e use em caixa alta os grandes bordões nos momentos cruciais.
Use termos emblemáticos como:
- "HAJA CORAÇÃO!" para momentos de grande tensão ou viradas heroicas.
- "OLHA O QUE ELE FEZ! OLHA O QUE ELE FEZ!" para jogadas espetaculares ou gols brilhantes.
- "É teste para cardíaco, amigo!"
- "Quem é que sobe? Quem é que vem?" ou "Pode isso, Arnaldo?" em tom de diálogo clássico de transmissão de TV.
- "Que momento dramático!" / "Que espetáculo!" / "É TETRA! É campeão!"
- "Diga lá, Tino!" e "Sentiu!" para lesões ou momentos dramáticos de cansaço.
A narrativa deve parecer uma transmissão épica de Copa do Mundo de domingo à tarde, cheia de suspense, orgulho, dramaticidade e emoção popular.`
  },
  'bruno-formiga': {
    name: "Bruno Formiga",
    introPhrase: "Fala galera! Se a gente pegar o recorte da realidade, é o seguinte...",
    instruction: `Você é o jornalista, comentarista e criador de conteúdo brasileiro Bruno Formiga (da TNT Sports), famoso por suas análises passionais, recortes de desempenho, comparações históricas e argumentos provocativos.
Seu estilo é ANALÍTICO, ENÉRGICO, DIRETO e FOCO EM RECORDES E CONTEXTO.
Quando você escreve:
- Use e abuse de expressões e bordões característicos dele, como:
  * "Vamos ao recorte da realidade..."
  * "Olhando a amostragem..."
  * "O contexto explica muito mais do que o número frio..."
  * "Isso é pesado demais!", "É um absurdo completo!"
  * "Não dá pra fazer tempestade em copo d'água, mas..."
  * "E aí eu pergunto pra você leitor..."
- Estruture seus raciocínios desmontando narrativas fáceis ou clichês com argumentos lógicos, dados de momento e percepções de campo.
- Compare a fase do jogador com grandes nomes ou momentos do futebol mundial para instigar o debate.
- Mantenha um tom moderno, ágil, conversacional e empolgado, como se estivesse apresentando um vídeo viral de análise no YouTube ou debatendo no estúdio.`
  },
  'nelson-rodrigues': {
    name: "Nelson Rodrigues",
    introPhrase: "Meus jovens, o futebol não é uma reles questão de tática; é uma questão de alma e destino...",
    instruction: `Você é o maior dramaturgo, romancista e cronista de futebol da história do Brasil, o mestre Nelson Rodrigues.
Seu estilo é VISCERAL, HIPERBÓLICO, POÉTICO, METAFÍSICO e TRÁGICO-ÉPICO. Para você, uma partida de futebol não é um evento esportivo comum, mas uma verdadeira tragédia grega encenada em 90 minutos de angústia, milagres, sangue e glória.
Características obrigatórias de escrita:
- Despreze friamente os "idiotas da objetividade" (aqueles que só olham estatísticas frias sem enxergar a alma).
- Invoque as figuras míticas do seu universo futebolístico:
  * "Sobrenatural de Almeida" (a força misteriosa e maligna que causa a zica, a bola na trave ou a tragédia inesperada).
  * "Complexo de Vira-Lata" (a dúvida do povo superada pelo gênio que veste a camisa).
  * "A Pátria de Chuteiras" (a nação inteira batendo no peito com orgulho).
  * "A multidão uivante", "Gravata floridíssima", "A chuteira sagrada", "A joelhada da providência".
- Use adjetivos grandiosos e dramáticos: "sublime", "pavoroso", "epopeia monumental", "cegueira de paixão", "espetáculo dantesco", "milagre das multidões".
- Escreva crônicas de um lirismo arrebatador, com metáforas teatrais, diálogos dramáticos simulados e uma paixão avassaladora pela bola e pelo personagem.`
  }
};

// Helper to check if an API key looks valid and is not a placeholder
const isApiKeyValid = (key: any): boolean => {
  if (!key || typeof key !== "string") return false;
  const k = key.trim();
  return k !== "" && 
         k !== "undefined" && 
         k !== "null" && 
         k !== "MY_GEMINI_API_KEY" && 
         k.length > 10;
};

// API Endpoint for generating magazines
app.post("/api/gemini/generate", async (req, res) => {
  const { journalistId, settings, period, entries } = req.body;

  const provider = (req.headers["x-ai-provider"] as string) || settings?.aiProvider || "gemini";

  let apiKey: string | null = null;

  if (provider === "openai") {
    const clientKey = req.headers["x-openai-key"] || settings?.openaiApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.OPENAI_API_KEY)) {
      apiKey = process.env.OPENAI_API_KEY!.trim();
    }

    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API da OpenAI (ChatGPT) não configurada ou inválida! Clique no botão de chave 🔑 no canto superior direito e insira sua chave da OpenAI (sk-...)."
      });
    }
  } else if (provider === "anthropic") {
    const clientKey = req.headers["x-anthropic-key"] || settings?.anthropicApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.ANTHROPIC_API_KEY)) {
      apiKey = process.env.ANTHROPIC_API_KEY!.trim();
    }

    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API da Anthropic (Claude) não configurada ou inválida! Clique no botão de chave 🔑 no canto superior direito e insira sua chave da Anthropic (sk-ant-...)."
      });
    }
  } else {
    // Gemini
    const clientKey = req.headers["x-gemini-key"] || settings?.customApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.GEMINI_API_KEY)) {
      apiKey = process.env.GEMINI_API_KEY!.trim();
    }

    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API do Gemini não configurada ou inválida! Por favor, clique no botão de chave 🔑 no canto superior direito e insira sua chave obtida gratuitamente no Google AI Studio."
      });
    }
  }

  if (!settings || !journalistId || !period || !entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({
      error: "Dados incompletos para a geração da revista."
    });
  }

  const persona = journalistPersonas[journalistId] || journalistPersonas['pvc'];

  try {
    // Formulate a detailed prompt representing the career context and timeline
    const careerTypeText = settings.careerType === 'player' ? "Jogador" : "Treinador (Manager)";
    
    const systemInstruction = `
${persona.instruction}

INFORMAÇÕES DA CARREIRA NO EA FC:
- Nome do Personagem: ${settings.characterName}
- Tipo de Carreira: ${careerTypeText}
- Time Atual: ${settings.teamName}
- Temporada: ${req.body.season || settings.season}

PERÍODO DESTA REVISTA: ${period} (Temporada ${req.body.season || settings.season})

Você é o editor-chefe de uma revista de esportes de prestígio. Você deve escrever uma edição completa com várias páginas (artigos de prosa bem longos, bem escritos, dramáticos e cheios de detalhes) baseando-se nos acontecimentos da linha do tempo fornecida abaixo pelo usuário.
A revista deve conter:
1. Um título espetacular na capa alinhado ao seu tom jornalístico e personalidade.
2. Um subtítulo marcante.
3. Um texto editorial de introdução assinado por você (jornalista).
4. Páginas de matérias em profundidade. Você DEVE criar EXATAMENTE uma página de matéria para CADA registro fornecido na linha do tempo abaixo (um para cada ID de registro). NÃO faça textos resumidos nem genéricos; seja prolixo e extremamente rico em detalhes táticos, sentimentos, estatísticas e descrições poéticas!
5. Cada página de matéria deve corresponder a um registro de destaque da linha do tempo (definido em 'suggestedEntryId'). Você DEVE usar a imagem ou frame de vídeo anexado a esse registro para descrever fielmente os detalhes visuais da jogada ou foto na sua crônica.

REGRAS CRÍTICAS DE ORDENAÇÃO E INCLUSÃO COMPLETA (MANDATÓRIO):
- **INCLUSÃO OBRIGATÓRIA DE TODOS OS REGISTROS**: Você DEVE criar EXATAMENTE uma página de matéria no array de 'pages' do JSON para CADA registro fornecido na lista do prompt. Não pule nem junte registros diferentes em uma só página! Se o usuário enviou 3 registros, o array 'pages' deve ter exatamente 3 páginas. Se enviou 5, deve ter exatamente 5 páginas.
- **ORDEM CRONOLÓGICA RIGOROSA**: As páginas de matéria geradas no array 'pages' do JSON devem respeitar estritamente a mesma ordem sequencial dos registros fornecidos (do primeiro registro enviado para o último). O primeiro registro do prompt deve ser a primeira página de matéria ('pageNumber' subsequente à capa e editorial), o segundo registro deve ser a segunda página, e assim sucessivamente. NUNCA misture, inverta ou embaralhe a ordem cronológica dos fatos!

REGRAS CRÍTICAS DE ANÁLISE DE MÍDIA E PREVENÇÃO DE ALUCINAÇÃO (MANDATÓRIO):
- **PROIBIDO QUALQUER RECUSA DE ANÁLISE DE VÍDEO**: Quando o tipo de mídia for rotulado como 'Vídeo' ou 'Frame de Vídeo', você está recebendo uma IMAGEM ESTÁTICA (FRAME/SCREENSHOT) extraída da gravação do jogo. Você está TERMINANTEMENTE PROIBIDO de dizer que 'não pode assistir ao vídeo', que 'como IA não tem acesso a arquivos de vídeo', ou que 'não consegue analisar o lance por ser um vídeo'. Trate essa imagem estática como a captura do instante mais precioso do lance, e use-a em conjunto com a descrição fornecida para criar uma crônica futebolística perfeita, rica e imersiva, agindo como se estivesse analisando o lance completo na TV!
- **FIDELIDADE ABSOLUTA AOS FATOS E RESULTADOS (PROIBIDO INVENTAR VITÓRIAS OU OCULTAR DERROTAS)**: Você NÃO PODE, sob hipótese alguma, transformar derrotas, empates ou eliminações em vitórias ou classificações! Se a descrição em texto do usuário relatar derrota, eliminação de copa, desclassificação, perda de pênalti, cansaço, demissão ou qualquer momento negativo, a matéria correspondente DEVE focar 100% nisso com o tom correto. Escreva uma crônica jornalística dramática, triste, de lamento ou crítica tática dura sobre a queda e a perda do objetivo (ex: desclassificação). Nunca invente que o jogador se classificou ou venceu! O realismo do modo carreira depende de contar o drama das derrotas e a dor da desclassificação com a mesma paixão e seriedade de um título!
- **SEJA UM DETETIVE DO PLACAR (OCR DE PLACAR)**: Examine meticulosamente cada imagem ou frame de vídeo enviado. Procure por placares (scoreboards) virtuais típicos de EA FC / FIFA (geralmente no canto superior esquerdo, superior central, ou nas telas de estatísticas de fim de jogo). Extraia os números exatos e os nomes dos times exibidos. Se o placar estiver visível na imagem, você DEVE citar esses números exatos na crônica.
- **ANÁLISE VISUAL DO VÍDEO/LANCE (RESULTADO FINAL OU COMEMORAÇÃO)**: Os frames de vídeo enviados representam momentos estratégicos selecionados pelo usuário, enfatizando ou a **tela do resultado final do jogo (placar final e estatísticas)** ou a **comemoração de gol do personagem**. Exauste o exame visual desse frame: cite o placar exato exibido ou descreva o gesto e a vibração da comemoração na crônica esportiva.
- **NÃO IGNORE OS REGISTROS NEGATIVOS**: Cada registro (seja vitória, derrota, lesão, demissão ou transferência frustrada) deve receber uma página exclusiva de matéria dedicada a ele. Dê o mesmo peso e profundidade jornalística aos momentos difíceis e derrotas que você dá às grandes vitórias. Críticas ácidas, lamentos poéticos e lições táticas duras enriquecem a crônica do seu jornalista!

Gere o resultado estritamente no esquema JSON solicitado.
`;

    // Construct contents for Gemini, OpenAI, and Anthropic
    const contentsPartsGemini: any[] = [];
    const openAiContentParts: any[] = [];
    const anthropicContentParts: any[] = [];

    const userPromptIntro = `Olá, meu caro jornalista! Escreva para mim a edição da revista referente ao período: "${period}".

Aqui está a lista cronológica de acontecimentos e registros da minha carreira neste período. Por favor, analise a descrição em texto de cada registro e, PRINCIPALMENTE, examine as mídias (fotos ou frames de vídeo) que anexei inline em cada registro correspondente para descrever com precisão visual os lances, placares e emoções na sua crônica esportiva:
`;

    contentsPartsGemini.push({ text: userPromptIntro });
    openAiContentParts.push({ type: "text", text: userPromptIntro });
    anthropicContentParts.push({ type: "text", text: userPromptIntro });

    entries.forEach((entry: any, index: number) => {
      const hasVideoFrames = entry.videoFrames && Array.isArray(entry.videoFrames) && entry.videoFrames.length > 0;
      const hasGallery = entry.galleryUrls && Array.isArray(entry.galleryUrls) && entry.galleryUrls.length > 0;
      const hasHtml = Boolean(entry.htmlCode && entry.htmlCode.trim());

      const mediaTypeLabel = hasHtml
        ? "Código HTML / Apresentação Canvas Incorporada"
        : hasGallery
        ? `Carrossel / Galeria de Imagens (${entry.galleryUrls.length} fotos)`
        : hasVideoFrames 
        ? "Vídeo (Sequência de frames/cenas cronológicas extraídas do vídeo completo)" 
        : (entry.mediaType === 'video' ? "Frame Estático de Vídeo (Screenshot)" : "Imagem/Screenshot");

      const entryText = `
--- REGISTRO #${index + 1} ---
ID: ${entry.id}
Título: ${entry.title}
Mês na Temporada: ${entry.month}
Tipo de Evento: ${entry.type}
Tipo de Mídia Anexa: ${mediaTypeLabel}
Descrição do Usuário: ${entry.description}
Possui Código HTML / Canvas Incorporado: ${hasHtml ? "Sim" : "Não"}
Possui Carrossel de Múltiplas Fotos: ${hasGallery ? "Sim" : "Não"}
Possui Sequência de Cenas de Vídeo: ${hasVideoFrames ? "Sim" : "Não"}
Possui Imagem/Thumbnail adicional: ${entry.mediaBase64 ? "Sim" : "Não"}

ATENÇÃO CRÍTICA DO JORNALISTA PARA O REGISTRO #${index + 1}:
1. **ANÁLISE FIEL DOS RESULTADOS**: Você DEVE ler com atenção a descrição acima e examinar todas as mídias anexadas (fotos, carrossel de imagens, código HTML/Canvas ou sequência do vídeo). Se o usuário relatar derrota, eliminação, desclassificação, perda de pênalti ou qualquer frustração (ou se isso estiver visível nas imagens/HTML), a matéria correspondente DEVE focar totalmente na DERROTA ou eliminação de forma dramática, melancólica, com sentimento de lamento ou crítica tática sincera e exigente sobre a queda do time. É TERMINANTEMENTE PROIBIDO inventar vitórias ou fingir que o time se classificou! O realismo do modo carreira exige reportar a queda e a tristeza da desclassificação de forma séria e profunda.
2. **ANÁLISE DE HTML / CANVAS**: Se houver um Código HTML ou apresentação Canvas anexado, analise minuciosamente todas as informações, textos, gráficos, dados ou slides nele descritos e incorpore esses insights e estatísticas no seu artigo jornalístico.
3. **DETALHES DO CARROSSEL DE FOTOS**: Se houver um carrossel com múltiplas fotos, observe cada uma das fotos para comentar a sequência dos momentos e reações na matéria!
`;
      contentsPartsGemini.push({ text: entryText });
      openAiContentParts.push({ type: "text", text: entryText });
      anthropicContentParts.push({ type: "text", text: entryText });

      if (hasHtml) {
        const htmlIntro = `[CÓDIGO HTML / APRESENTAÇÃO CANVAS DO REGISTRO #${index + 1} (ID: "${entry.id}") - INÍCIO. Analise os textos e elementos do HTML abaixo:]\n\`\`\`html\n${entry.htmlCode}\n\`\`\`\n[FIM DO CÓDIGO HTML DO REGISTRO #${index + 1}.]`;
        contentsPartsGemini.push({ text: htmlIntro });
        openAiContentParts.push({ type: "text", text: htmlIntro });
        anthropicContentParts.push({ type: "text", text: htmlIntro });
      }

      if (hasGallery) {
        const galIntro = `[CARROSSEL DE IMAGENS DO REGISTRO #${index + 1} (ID: "${entry.id}") - ${entry.galleryUrls.length} FOTOS EM GALERIA - INÍCIO.]`;
        contentsPartsGemini.push({ text: galIntro });
        openAiContentParts.push({ type: "text", text: galIntro });
        anthropicContentParts.push({ type: "text", text: galIntro });

        entry.galleryUrls.forEach((gUrl: string, gIdx: number) => {
          const match = gUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            const photoLabel = `[Foto ${gIdx + 1} de ${entry.galleryUrls.length} do Carrossel:]`;

            contentsPartsGemini.push({ text: photoLabel });
            contentsPartsGemini.push({ inlineData: { mimeType, data: base64Data } });

            openAiContentParts.push({ type: "text", text: photoLabel });
            openAiContentParts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } });

            anthropicContentParts.push({ type: "text", text: photoLabel });
            anthropicContentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } });
          } else if (gUrl.startsWith("http://") || gUrl.startsWith("https://")) {
            const urlLabel = `[Foto ${gIdx + 1} do Carrossel (URL): ${gUrl}]`;
            contentsPartsGemini.push({ text: urlLabel });
            openAiContentParts.push({ type: "text", text: urlLabel });
            openAiContentParts.push({ type: "image_url", image_url: { url: gUrl } });
            anthropicContentParts.push({ type: "text", text: urlLabel });
          }
        });

        const galOutro = `[FIM DO CARROSSEL DE IMAGENS DO REGISTRO #${index + 1}.]`;
        contentsPartsGemini.push({ text: galOutro });
        openAiContentParts.push({ type: "text", text: galOutro });
        anthropicContentParts.push({ type: "text", text: galOutro });
      }

      if (hasVideoFrames) {
        const vidIntro = `[VÍDEO DO REGISTRO #${index + 1} (ID: "${entry.id}") - CENAS CHAVE SEQUENCIAIS EM ORDEM CRONOLÓGICA - INÍCIO. Analise as imagens abaixo para entender o desenrolar completo da jogada:]`;
        contentsPartsGemini.push({ text: vidIntro });
        openAiContentParts.push({ type: "text", text: vidIntro });
        anthropicContentParts.push({ type: "text", text: vidIntro });

        entry.videoFrames.forEach((frameBase64: string, frameIdx: number) => {
          const match = frameBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];

            const sceneLabel = `[Cena ${frameIdx + 1} de 5 do lance do vídeo:]`;
            contentsPartsGemini.push({ text: sceneLabel });
            contentsPartsGemini.push({ inlineData: { mimeType, data: base64Data } });

            openAiContentParts.push({ type: "text", text: sceneLabel });
            openAiContentParts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } });

            anthropicContentParts.push({ type: "text", text: sceneLabel });
            anthropicContentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } });
          }
        });

        const vidOutro = `[FIM DAS CENAS SEQUENCIAIS DO VÍDEO DO REGISTRO #${index + 1}.]`;
        contentsPartsGemini.push({ text: vidOutro });
        openAiContentParts.push({ type: "text", text: vidOutro });
        anthropicContentParts.push({ type: "text", text: vidOutro });
      }

      if (entry.mediaBase64) {
        const match = entry.mediaBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];

          const imgIntro = `[IMAGEM/CAPTURA DO REGISTRO #${index + 1} (ID: "${entry.id}") - INÍCIO.]`;
          const imgOutro = `[FIM DA IMAGEM DO REGISTRO #${index + 1}. Assinale os detalhes desta imagem na matéria da página correspondente com 'suggestedEntryId' = "${entry.id}"]`;

          contentsPartsGemini.push({ text: imgIntro });
          contentsPartsGemini.push({ inlineData: { mimeType, data: base64Data } });
          contentsPartsGemini.push({ text: imgOutro });

          openAiContentParts.push({ type: "text", text: imgIntro });
          openAiContentParts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } });
          openAiContentParts.push({ type: "text", text: imgOutro });

          anthropicContentParts.push({ type: "text", text: imgIntro });
          anthropicContentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } });
          anthropicContentParts.push({ type: "text", text: imgOutro });
        }
      }
    });

    const userPromptOutro = `
Por favor, redija agora as matérias completas seguindo com total fidelidade o seu estilo e os fatos descritos. Use e comente os detalhes visuais das mídias anexadas para enriquecer o texto. Lembre-se de retornar cada página com seu respectivo 'suggestedEntryId' correspondente para associar a foto à página correta na nossa revista.

Escreva artigos longos, dramáticos, táticos e de alto nível!
`;
    contentsPartsGemini.push({ text: userPromptOutro });
    openAiContentParts.push({ type: "text", text: userPromptOutro });
    anthropicContentParts.push({ type: "text", text: userPromptOutro });

    // Branch execution based on chosen Provider
    if (provider === "openai") {
      console.log("Processando geração via OpenAI (ChatGPT)...");
      const openAiMessages = [
        { 
          role: "system", 
          content: systemInstruction + "\n\nVocê DEVE responder ESTRITAMENTE com um objeto JSON válido no formato:\n{\n  \"magazineTitle\": \"...\",\n  \"magazineSubtitle\": \"...\",\n  \"editorialText\": \"...\",\n  \"pages\": [\n    {\n      \"pageNumber\": 1,\n      \"title\": \"...\",\n      \"content\": \"...\",\n      \"caption\": \"...\",\n      \"suggestedEntryId\": \"...\"\n    }\n  ]\n}" 
        },
        { role: "user", content: openAiContentParts }
      ];

      const modelsToTry = ["gpt-4o-mini", "gpt-4o"];
      let rawText = "";
      let lastErr = null;

      for (const openAiModel of modelsToTry) {
        try {
          console.log(`Tentando OpenAI com modelo ${openAiModel}...`);
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: openAiModel,
              response_format: { type: "json_object" },
              temperature: 0.85,
              messages: openAiMessages
            })
          });

          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.error?.message || `Erro da OpenAI (${response.status})`);
          }
          rawText = json.choices?.[0]?.message?.content || "";
          if (rawText) break;
        } catch (err: any) {
          console.warn(`Erro na tentativa OpenAI (${openAiModel}):`, err.message);
          lastErr = err;
        }
      }

      if (!rawText) {
        throw lastErr || new Error("Não foi possível gerar a revista através da OpenAI.");
      }

      const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const magazineData = JSON.parse(cleaned);
      return res.json(magazineData);
    } 

    if (provider === "anthropic") {
      console.log("Processando geração via Anthropic (Claude)...");
      const anthropicMessages = [
        { role: "user", content: anthropicContentParts }
      ];

      const modelsToTry = ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"];
      let rawText = "";
      let lastErr = null;

      for (const claudeModel of modelsToTry) {
        try {
          console.log(`Tentando Anthropic com modelo ${claudeModel}...`);
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey!,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: claudeModel,
              max_tokens: 8192,
              system: systemInstruction + "\n\nVocê DEVE responder ESTRITAMENTE e APENAS com um objeto JSON válido contendo os campos: magazineTitle, magazineSubtitle, editorialText e pages (array com objetos contendo pageNumber, title, content, caption, suggestedEntryId).",
              messages: anthropicMessages
            })
          });

          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.error?.message || `Erro da Anthropic (${response.status})`);
          }
          rawText = json.content?.[0]?.text || "";
          if (rawText) break;
        } catch (err: any) {
          console.warn(`Erro na tentativa Anthropic (${claudeModel}):`, err.message);
          lastErr = err;
        }
      }

      if (!rawText) {
        throw lastErr || new Error("Não foi possível gerar a revista através da Anthropic.");
      }

      const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const magazineData = JSON.parse(cleaned);
      return res.json(magazineData);
    }

    // Default: Gemini via GoogleGenAI SDK
    let currentApiKey = apiKey;
    let ai = new GoogleGenAI({
      apiKey: currentApiKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Define response schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        magazineTitle: {
          type: Type.STRING,
          description: "Título principal marcante e poético para a capa da revista esportiva."
        },
        magazineSubtitle: {
          type: Type.STRING,
          description: "Subtítulo atraente de capa detalhando a grande história."
        },
        editorialText: {
          type: Type.STRING,
          description: "Texto editorial/carta de abertura do jornalista, refletindo sobre o período com sua assinatura típica."
        },
        pages: {
          type: Type.ARRAY,
          description: "A lista de páginas da revista. Você DEVE incluir exatamente 1 página de matéria para cada registro da timeline fornecido no prompt, mantendo exatamente a mesma ordem cronológica sequencial em que foram listados (do primeiro para o último registro).",
          items: {
            type: Type.OBJECT,
            properties: {
              pageNumber: { type: Type.INTEGER },
              title: { 
                type: Type.STRING, 
                description: "Título marcante da página ou capítulo da matéria." 
              },
              content: { 
                type: Type.STRING, 
                description: "O texto completo do artigo jornalístico em formato Markdown. Deve conter vários parágrafos, ser rico em detalhes e emular perfeitamente o jornalista. Não resuma!" 
              },
              caption: { 
                type: Type.STRING, 
                description: "Legenda de foto de jornalismo esportivo para esta página." 
              },
              suggestedEntryId: { 
                type: Type.STRING, 
                description: "O ID exato do registro correspondente da linha do tempo. A ordem sequencial das páginas geradas deve respeitar estritamente a ordem que os registros foram listados no prompt." 
              }
            },
            required: ["pageNumber", "title", "content", "caption", "suggestedEntryId"]
          }
        }
      },
      required: ["magazineTitle", "magazineSubtitle", "editorialText", "pages"]
    };

    let response: any = null;
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    
    // If the user is using their own custom API key, prioritize the ultra-powerful Gemini Pro model
    // which has superb OCR, vision understanding, and advanced journalistic writing capabilities.
    if (currentApiKey && currentApiKey !== process.env.GEMINI_API_KEY) {
      modelsToTry.unshift("gemini-3.1-pro-preview");
    }
    
    for (const modelToUse of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Tentando gerar conteúdo com o modelo ${modelToUse} (Tentativa ${attempt}/2)...`);
          const genResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: { parts: contentsPartsGemini },
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.85,
            }
          });
          
          if (genResponse && genResponse.text) {
            response = genResponse;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errStr = String(err.message || err);
          console.warn(`Erro com o modelo ${modelToUse} na tentativa ${attempt}:`, errStr);

          // If custom key was denied/restricted/unauthenticated, fall back to system default key and retry immediately
          if (
            currentApiKey !== process.env.GEMINI_API_KEY &&
            isApiKeyValid(process.env.GEMINI_API_KEY) &&
            (errStr.includes("PERMISSION_DENIED") ||
              errStr.includes("denied access") ||
              errStr.includes("403") ||
              errStr.includes("401") ||
              errStr.includes("UNAUTHENTICATED") ||
              errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
              errStr.includes("API_KEY_INVALID"))
          ) {
            console.warn("Chave de API personalizada falhou na autenticação ou permissão. Trocando para a chave do sistema...");
            currentApiKey = process.env.GEMINI_API_KEY!;
            ai = new GoogleGenAI({
              apiKey: currentApiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });
            attempt--; // Try this model attempt again with the system key
            continue;
          }
          
          // If it's the last attempt for the last model, don't wait, we'll let it fail or bubble up
          if (modelToUse === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
            break;
          }
          
          // Wait 1.5 seconds before retrying to let temporary spikes pass
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      if (response) {
        break; // Success! Skip other models.
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Não foi possível obter resposta de nenhum modelo Gemini.");
    }

    const responseText = response.text;
    const magazineData = JSON.parse(responseText.trim());
    return res.json(magazineData);

  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    
    // Convert error to string and search for typical quota/billing/credits keywords
    const errStr = (JSON.stringify(error) + " " + String(error.message || error)).toUpperCase();
    let userFriendlyError = "Ocorreu um erro ao gerar a narrativa com a IA do Gemini. Detalhes: " + (error.message || error);

    if (
      errStr.includes("UNAUTHENTICATED") || 
      errStr.includes("401") || 
      errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || 
      errStr.includes("API_KEY_INVALID")
    ) {
      userFriendlyError = `Chave de API do Gemini inválida ou não autorizada (Erro de Autenticação 401)! 

Por favor, verifique a chave de API configurada:
1. Clique no botão de chave 🔑 (Chave de API) ou de engrenagem ⚙️ (Configurações) no canto superior direito da tela.
2. Certifique-se de que inseriu uma chave de API válida obtida gratuitamente no Google AI Studio (https://aistudio.google.com/).
3. Se você não inseriu uma chave personalizada, a chave compartilhada do sistema pode estar instável ou desativada temporariamente. Nesse caso, criar sua própria chave gratuita no Google AI Studio resolverá o problema instantaneamente!`;
    } else if (
      errStr.includes("RESOURCE_EXHAUSTED") || 
      errStr.includes("QUOTA") || 
      errStr.includes("PREPAYMENT CREDITS") || 
      errStr.includes("429") || 
      errStr.includes("DEPLETED") ||
      errStr.includes("LIMIT")
    ) {
      userFriendlyError = `Créditos temporariamente indisponíveis! Os créditos compartilhados de inteligência artificial do desenvolvedor foram esgotados devido ao altíssimo número de revistas geradas hoje.

Para continuar escrevendo crônicas detalhadas e ilimitadas agora mesmo e de forma 100% gratuita, basta configurar sua própria Chave de API individual:

1. Clique no botão de engrenagem ⚙️ (Configurações) no canto superior direito da tela.
2. Acesse o Google AI Studio (https://aistudio.google.com/) para obter uma Chave de API grátis em 30 segundos (clique em "Get API Key").
3. Cole sua chave no campo correspondente e salve!

Isso ativará uma cota de processamento dedicada, rápida e gratuita só para você.`;
    }
    
    return res.status(500).json({
      error: userFriendlyError
    });
  }
});

// API Endpoint for regenerating a single article page based on user instructions and journalist persona
app.post("/api/gemini/regenerate-page", async (req, res) => {
  const { journalistId, settings, page, userCorrection, entry } = req.body;

  // Retrieve API Key: headers first, then server environment variable
  const clientKey = req.headers["x-gemini-key"];
  
  let apiKey: string | null = null;
  if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
    apiKey = clientKey.trim();
  }

  // Always allow falling back to server-side key if client hasn't provided a valid one
  if (!apiKey && isApiKeyValid(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY!.trim();
  }

  if (!apiKey) {
    return res.status(400).json({
      error: "Chave de API do Gemini não configurada ou inválida! Por favor, clique no botão de chave 🔑 (Chave de API) ou de engrenagem ⚙️ (Configurações) no canto superior direito e insira sua chave obtida gratuitamente no Google AI Studio."
    });
  }

  if (!settings || !journalistId || !page || !userCorrection) {
    return res.status(400).json({
      error: "Dados incompletos para a regeneração da matéria."
    });
  }

  const persona = journalistPersonas[journalistId] || journalistPersonas['pvc'];

  try {
    let currentApiKey = apiKey;
    let ai = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const careerTypeText = settings.careerType === 'player' ? "Jogador" : "Treinador (Manager)";
    
    const systemInstruction = `
${persona.instruction}

INFORMAÇÕES DA CARREIRA NO EA FC:
- Nome do Personagem: ${settings.characterName}
- Tipo de Carreira: ${careerTypeText}
- Time Atual: ${settings.teamName}
- Temporada: ${settings.season}

Você é o jornalista esportivo contratado. O usuário identificou que houve uma ALUCINAÇÃO ou ERRO de interpretação na matéria que você escreveu para a página ${page.pageNumber}.
Você DEVE reescrever e corrigir ESSA MATÉRIA ESPECÍFICA com base nas novas instruções e correções táticas fornecidas pelo usuário abaixo.

REGRAS CRÍTICAS DE CORREÇÃO:
1. **FIDELIDADE TOTAL À CORREÇÃO DO USUÁRIO**: A instrução corretiva do usuário é a sua diretriz máxima. Se o usuário diz que o time PERDEU, que o lance foi contra, ou explica detalhes específicos da jogada (quem fez o gol, quem falhou), você DEVE incorporar esses fatos com precisão absoluta, emulando perfeitamente o seu estilo jornalístico. É proibido ignorar a correção do usuário!
2. **MANTER O ESTILO PERSONA**: Continue escrevendo no mesmo tom e persona de ${persona.name}. Seja prolixo, escreva crônicas profundas, emotivas e ricas em termos táticos e poéticos.
3. **Markdown**: Retorne o conteúdo do artigo no campo 'content' utilizando formato Markdown rico e longo.

Gere o resultado estritamente no esquema JSON solicitado.
`;

    const contentsParts: any[] = [];
    
    let promptText = `Olá, meu caro jornalista!
Por favor, REESCREVA e CORRIJA a matéria da página ${page.pageNumber}.

MATÉRIA ANTERIOR (COM ERRO):
Título: ${page.title}
Conteúdo Anterior: 
${page.content}
Legenda Anterior: ${page.caption}

REGISTRO DA TIMELINE CORRESPONDENTE:
ID: ${page.suggestedEntryId}
${entry ? `Título do Registro: ${entry.title}
Descrição Inicial do Usuário: ${entry.description}
Tipo de Evento: ${entry.type}
Mês: ${entry.month}` : 'Nenhum registro extra fornecido.'}

AQUI ESTÁ A CORREÇÃO CRUCIAL QUE VOCÊ DEVE SEGUIR:
"${userCorrection}"

Por favor, reescreva a matéria inteira corrigindo as alucinações e mantendo o seu estilo brilhante.
`;

    contentsParts.push({ text: promptText });

    // If entry contains images/video storyboard frames, pass them inline so the model can visually re-analyze them with the correction in mind!
    if (entry) {
      const hasVideoFrames = entry.videoFrames && Array.isArray(entry.videoFrames) && entry.videoFrames.length > 0;
      if (hasVideoFrames) {
        contentsParts.push({
          text: `[RE-ANÁLISE DE VÍDEO - CENAS CHAVE SEQUENCIAIS EM ORDEM CRONOLÓGICA - INÍCIO. Analise as imagens para alinhar com a nova correção:]`
        });
        entry.videoFrames.forEach((frameBase64: string, frameIdx: number) => {
          const match = frameBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            contentsParts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          }
        });
        contentsParts.push({
          text: `[FIM DAS CENAS SEQUENCIAIS DO VÍDEO]`
        });
      }

      if (entry.mediaUrl) {
        const match = entry.mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          contentsParts.push({
            text: `[RE-ANÁLISE DE CAPTURA VISUAL - INÍCIO]`
          });
          contentsParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
          contentsParts.push({
            text: `[FIM DA CAPTURA VISUAL]`
          });
        }
      }
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "O novo título marcante para esta matéria."
        },
        caption: {
          type: Type.STRING,
          description: "A nova legenda para a imagem desta matéria."
        },
        content: {
          type: Type.STRING,
          description: "O texto reescrito completo em formato Markdown, incorporando a correção e mantendo o estilo marcante."
        }
      },
      required: ["title", "caption", "content"]
    };

    let response: any = null;
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    
    if (currentApiKey && currentApiKey !== process.env.GEMINI_API_KEY) {
      modelsToTry.unshift("gemini-3.1-pro-preview");
    }
    
    for (const modelToUse of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Tentando REGENERAR matéria com o modelo ${modelToUse} (Tentativa ${attempt}/2)...`);
          const genResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: { parts: contentsParts },
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.8,
            }
          });
          
          if (genResponse && genResponse.text) {
            response = genResponse;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errStr = String(err.message || err);
          console.warn(`Erro na regeneração com o modelo ${modelToUse} na tentativa ${attempt}:`, errStr);

          if (
            currentApiKey !== process.env.GEMINI_API_KEY &&
            isApiKeyValid(process.env.GEMINI_API_KEY) &&
            (errStr.includes("PERMISSION_DENIED") ||
              errStr.includes("denied access") ||
              errStr.includes("403") ||
              errStr.includes("401") ||
              errStr.includes("UNAUTHENTICATED") ||
              errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
              errStr.includes("API_KEY_INVALID"))
          ) {
            console.warn("Chave de API personalizada falhou na autenticação ou permissão ao regenerar. Trocando para a chave do sistema...");
            currentApiKey = process.env.GEMINI_API_KEY!;
            ai = new GoogleGenAI({
              apiKey: currentApiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });
            attempt--;
            continue;
          }
          
          if (modelToUse === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      if (response) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Não foi possível obter resposta do Gemini.");
    }

    const responseText = response.text;
    const regeneratedPage = JSON.parse(responseText.trim());
    return res.json(regeneratedPage);

  } catch (error: any) {
    console.error("Erro na API do Gemini ao regenerar página:", error);
    
    const errStr = (JSON.stringify(error) + " " + String(error.message || error)).toUpperCase();
    let userFriendlyError = "Ocorreu um erro ao regenerar a matéria com o Gemini: " + (error.message || error);

    if (
      errStr.includes("UNAUTHENTICATED") || 
      errStr.includes("401") || 
      errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || 
      errStr.includes("API_KEY_INVALID")
    ) {
      userFriendlyError = `Chave de API do Gemini inválida ou não autorizada (Erro de Autenticação 401)! 

Por favor, verifique a chave de API configurada nas Configurações (ícone de engrenagem ⚙️ no canto superior direito). Certifique-se de que inseriu uma chave de API válida obtida gratuitamente no Google AI Studio (https://aistudio.google.com/).`;
    }

    return res.status(500).json({
      error: userFriendlyError
    });
  }
});

// Serve frontend assets
async function startServer() {
  // Serve Firebase config file dynamically from the root folder
  app.get("/firebase-applet-config.json", (req, res) => {
    res.sendFile(path.join(process.cwd(), "firebase-applet-config.json"));
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
