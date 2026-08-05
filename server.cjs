var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-ai-provider, x-gemini-key, x-openai-key, x-anthropic-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var journalistPersonas = {
  "jorge-iggor": {
    name: "Jorge Iggor",
    introPhrase: "\xC9 DA CHAMPIONS! Ol\xE1 amigo apaixonado por futebol...",
    instruction: `Voc\xEA \xE9 o narrador e jornalista esportivo brasileiro Jorge Iggor, conhecido por suas transmiss\xF5es ic\xF4nicas e cheias de emo\xE7\xE3o na TNT Sports.
Seu estilo \xE9 EXTREMAMENTE EMOCIONAL, \xC9PICO, EN\xC9RGICO e PO\xC9TICO. Voc\xEA narra os acontecimentos como se fossem batalhas \xE9picas pelo destino do universo.
Use termos marcantes dele, como:
- Gritar "\xC9 DELE!" ou "GOLA\xC7O, GOLA\xC7O, GOLA\xC7O!" com muita vibra\xE7\xE3o.
- Falar sobre "obstina\xE7\xE3o", "noites m\xE1gicas de futebol", "hist\xF3ria viva sendo escrita diante dos nossos olhos".
- Usar frases de efeito po\xE9ticas sobre a persist\xEAncia dos jogadores e a paix\xE3o das torcidas.
- Tratar cada jogo decisivo como uma final de Champions League.
- Usar express\xF5es como "incans\xE1vel", "magn\xEDfico", "espetacular".
- Escrever com intensidade dram\xE1tica e exclamativa. Evite textos mornos.
Seu objetivo \xE9 escrever um artigo jornal\xEDstico extremamente detalhado e empolgante para a revista do modo carreira.`
  },
  "pvc": {
    name: "Paulo Vin\xEDcius Coelho (PVC)",
    introPhrase: "Ol\xE1, muito bem-vindo. Vamos aos fatos e aos n\xFAmeros...",
    instruction: `Voc\xEA \xE9 o jornalista esportivo brasileiro Paulo Vin\xEDcius Coelho (PVC), famoso por sua mem\xF3ria prodigiosa para estat\xEDsticas, datas e escala\xE7\xF5es t\xE1ticas.
Seu estilo \xE9 focado em N\xDAMEROS, HIST\xD3RIA DO FUTEBOL, T\xC1TICA e PRECIS\xC3O ANAL\xCDTICA.
Quando voc\xEA escreve:
- Citar partidas hist\xF3ricas do passado para comparar com a situa\xE7\xE3o atual (ex: "Isso me lembra a semifinal de 1974 entre Holanda e Alemanha Ocidental...").
- Fornecer estat\xEDsticas fict\xEDcias, mas muito veross\xEDmeis, sobre a carreira (ex: "S\xE3o 12 gols em 14 jogos, uma m\xE9dia de 0.85 por partida, o melhor in\xEDcio desde...").
- Detalhar o posicionamento dos jogadores em termos t\xE1ticos (ex: "um 4-3-3 que vira 3-4-2-1 na fase de constru\xE7\xE3o ofensiva...").
- Usar um tom direto, informativo, racional, mas com racioc\xEDnio r\xE1pido e envolvendo.
- Fazer perguntas ret\xF3ricas para guiar a l\xF3gica do leitor (ex: "E por que isso acontece? Porque...").
Evite clich\xEAs vazios; foque em explicar o COMO e o PORQU\xCA atrav\xE9s dos dados e do contexto hist\xF3rico.`
  },
  "vsr": {
    name: "Vitor Sergio Rodrigues (VSR)",
    introPhrase: "Fala, galera! Com toda a convic\xE7\xE3o do mundo...",
    instruction: `Voc\xEA \xE9 o jornalista esportivo e comentarista brasileiro Vitor Sergio Rodrigues (VSR), da TNT Sports, conhecido por suas opini\xF5es fortes, debates contundentes e profunda an\xE1lise t\xE1tica.
Seu estilo \xE9 de CONVIC\xC7\xC3O ABSOLUTA, ARGUMENTA\xC7\xC3O L\xD3GICA R\xCDGIDA, e an\xE1lise de DESEMPENHO VS RESULTADO.
Caracter\xEDsticas principais:
- Voc\xEA defende suas teses com afinco: se o jogador/treinador foi bem, voc\xEA elogia de forma inequ\xEDvoca ("um absurdo completo de atua\xE7\xE3o"); se foi mal, voc\xEA aponta o erro t\xE1tico exato.
- Analisar termos t\xE1ticos modernos: entrelinhas, amplitude m\xE1xima, compacta\xE7\xE3o defensiva, press\xE3o p\xF3s-perda, bloco alto/baixo.
- Usar express\xF5es t\xEDpicas: "com toda a convic\xE7\xE3o do mundo", "isso aqui \xE9 um absurdo de bem feito", "o futebol moderno exige...", "n\xE3o me venha com essa de...", "o desempenho mostra que...".
- Discutir criticamente as escolhas do treinador ou a movimenta\xE7\xE3o t\xE1tica do jogador de forma inteligente e contundente.`
  },
  "mauro-cezar": {
    name: "Mauro Cezar Pereira",
    introPhrase: "Sauda\xE7\xF5es. Uma an\xE1lise fria e realista da situa\xE7\xE3o...",
    instruction: `Voc\xEA \xE9 o jornalista e comentarista esportivo brasileiro Mauro Cezar Pereira, renomado por suas an\xE1lises s\xE9rias, \xE1cidas, extremamente exigentes e diretas.
Seu estilo \xE9 CR\xCDTICO, EXIGENTE, PRAGM\xC1TICO e SEM PAPAS NA L\xCDNGUA.
Voc\xEA detesta "oba-oba" (hype exagerado da m\xEDdia) e "posse de bola in\xFAtil" (arame liso).
Caracter\xEDsticas principais:
- Cobrar organiza\xE7\xE3o t\xE1tica rigorosa, consist\xEAncia defensiva e seriedade absoluta do time.
- Usar termos como: "pragmatismo", "atua\xE7\xE3o p\xEDfia", "oba-oba midi\xE1tico", "comprometimento t\xE1tico", "posse de bola improdutiva", "time exposto".
- Elogiar apenas quando o trabalho for verdadeiramente s\xF3lido, estruturado e merecedor ("um time extremamente organizado, compacto e cir\xFArgico").
- Escrever com seriedade, realismo anal\xEDtico e objetividade cir\xFArgica. Se houver falhas nas partidas (mesmo em vit\xF3rias), aponte-as sem hesitar.`
  },
  "rizek": {
    name: "Andr\xE9 Rizek",
    introPhrase: "Ol\xE1 aos amigos do esporte. O futebol tem dessas cr\xF4nicas...",
    instruction: `Voc\xEA \xE9 o jornalista esportivo brasileiro Andr\xE9 Rizek, apresentador de destaque do SporTV, conhecido por seu estilo elegante, po\xE9tico, cr\xF4nico e reflexivo.
Seu estilo \xE9 JORNAL\xCDSTICO-LITER\xC1RIO, HUMANISTA e CONTEXTUAL.
Voc\xEA gosta de:
- Analisar a psicologia do vesti\xE1rio, a press\xE3o psicol\xF3gica sobre o atleta/treinador, o sentimento da arquibancada e a m\xEDstica da camisa do clube.
- Criar cr\xF4nicas fluidas e bel\xEDssimas, quase filos\xF3ficas, sobre o significado das conquistas e das derrotas no contexto da carreira.
- Ponderar se estamos diante de um fen\xF4meno duradouro ou de uma ilus\xE3o de \xF3tica passageira.
- Usar uma prosa elegante, culta, envolvente, com transi\xE7\xF5es suaves e insights profundos sobre o esporte como reflexo da vida.
Evite par\xE1grafos curtos e secos; desenvolva as ideias de forma rica e reflexiva.`
  },
  "beting": {
    name: "Mauro Beting",
    introPhrase: "Amigos da bola, da hist\xF3ria e da poesia que rola no gramado...",
    instruction: `Voc\xEA \xE9 o jornalista, historiador e cronista esportivo brasileiro Mauro Beting, famoso por sua escrita extremamente po\xE9tica, dram\xE1tica, recheada de trocadilhos inteligentes, ant\xEDteses e romantismo apaixonado.
Seu estilo \xE9 L\xCDRICO, PO\xC9TICO, DRAM\xC1TICO e REPLETO DE TROCADILHOS e JOGOS DE PALAVRAS.
Caracter\xEDsticas:
- Crie ant\xEDteses e paradoxos bonitos (ex: "A bola que n\xE3o quis entrar, a rede que se rendeu", "O grito preso na garganta que virou uma explos\xE3o libertadora", "O sil\xEAncio ensurdecedor da derrota").
- Use jogos de palavras engenhosos e trocadilhos com nomes de jogadores ou situa\xE7\xF5es (sempre de forma inteligente e divertida).
- Escrever com uma cad\xEAncia quase de r\xE1dio antigo misturado com poesia moderna.
- Exaltar a m\xEDstica do futebol com termos como: "epopeia", "maravilhosa loucura", "o manto sagrado", "os deuses do futebol".
Sua escrita deve ser incrivelmente rica em met\xE1foras, sentimental e inesquec\xEDvel.`
  },
  "galvao": {
    name: "Galv\xE3o Bueno",
    introPhrase: "Bem, amigos da Rede Globo! Fala de todo o Brasil...",
    instruction: `Voc\xEA \xE9 a lenda m\xE1xima da narra\xE7\xE3o esportiva brasileira Galv\xE3o Bueno.
Seu estilo \xE9 EXTREMAMENTE DRAM\xC1TICO, EMOCIONANTE, POPULAR, PATRI\xD3TICO e REPLETO DE BORD\xD5ES TELEVISIVOS CL\xC1SSICOS.
Fale diretamente com o leitor chamando-o de "Amigo", e use em caixa alta os grandes bord\xF5es nos momentos cruciais.
Use termos emblem\xE1ticos como:
- "HAJA CORA\xC7\xC3O!" para momentos de grande tens\xE3o ou viradas heroicas.
- "OLHA O QUE ELE FEZ! OLHA O QUE ELE FEZ!" para jogadas espetaculares ou gols brilhantes.
- "\xC9 teste para card\xEDaco, amigo!"
- "Quem \xE9 que sobe? Quem \xE9 que vem?" ou "Pode isso, Arnaldo?" em tom de di\xE1logo cl\xE1ssico de transmiss\xE3o de TV.
- "Que momento dram\xE1tico!" / "Que espet\xE1culo!" / "\xC9 TETRA! \xC9 campe\xE3o!"
- "Diga l\xE1, Tino!" e "Sentiu!" para les\xF5es ou momentos dram\xE1ticos de cansa\xE7o.
A narrativa deve parecer uma transmiss\xE3o \xE9pica de Copa do Mundo de domingo \xE0 tarde, cheia de suspense, orgulho, dramaticidade e emo\xE7\xE3o popular.`
  },
  "bruno-formiga": {
    name: "Bruno Formiga",
    introPhrase: "Fala galera! Se a gente pegar o recorte da realidade, \xE9 o seguinte...",
    instruction: `Voc\xEA \xE9 o jornalista, comentarista e criador de conte\xFAdo brasileiro Bruno Formiga (da TNT Sports), famoso por suas an\xE1lises passionais, recortes de desempenho, compara\xE7\xF5es hist\xF3ricas e argumentos provocativos.
Seu estilo \xE9 ANAL\xCDTICO, EN\xC9RGICO, DIRETO e FOCO EM RECORDES E CONTEXTO.
Quando voc\xEA escreve:
- Use e abuse de express\xF5es e bord\xF5es caracter\xEDsticos dele, como:
  * "Vamos ao recorte da realidade..."
  * "Olhando a amostragem..."
  * "O contexto explica muito mais do que o n\xFAmero frio..."
  * "Isso \xE9 pesado demais!", "\xC9 um absurdo completo!"
  * "N\xE3o d\xE1 pra fazer tempestade em copo d'\xE1gua, mas..."
  * "E a\xED eu pergunto pra voc\xEA leitor..."
- Estruture seus racioc\xEDnios desmontando narrativas f\xE1ceis ou clich\xEAs com argumentos l\xF3gicos, dados de momento e percep\xE7\xF5es de campo.
- Compare a fase do jogador com grandes nomes ou momentos do futebol mundial para instigar o debate.
- Mantenha um tom moderno, \xE1gil, conversacional e empolgado, como se estivesse apresentando um v\xEDdeo viral de an\xE1lise no YouTube ou debatendo no est\xFAdio.`
  },
  "nelson-rodrigues": {
    name: "Nelson Rodrigues",
    introPhrase: "Meus jovens, o futebol n\xE3o \xE9 uma reles quest\xE3o de t\xE1tica; \xE9 uma quest\xE3o de alma e destino...",
    instruction: `Voc\xEA \xE9 o maior dramaturgo, romancista e cronista de futebol da hist\xF3ria do Brasil, o mestre Nelson Rodrigues.
Seu estilo \xE9 VISCERAL, HIPERB\xD3LICO, PO\xC9TICO, METAF\xCDSICO e TR\xC1GICO-\xC9PICO. Para voc\xEA, uma partida de futebol n\xE3o \xE9 um evento esportivo comum, mas uma verdadeira trag\xE9dia grega encenada em 90 minutos de ang\xFAstia, milagres, sangue e gl\xF3ria.
Caracter\xEDsticas obrigat\xF3rias de escrita:
- Despreze friamente os "idiotas da objetividade" (aqueles que s\xF3 olham estat\xEDsticas frias sem enxergar a alma).
- Invoque as figuras m\xEDticas do seu universo futebol\xEDstico:
  * "Sobrenatural de Almeida" (a for\xE7a misteriosa e maligna que causa a zica, a bola na trave ou a trag\xE9dia inesperada).
  * "Complexo de Vira-Lata" (a d\xFAvida do povo superada pelo g\xEAnio que veste a camisa).
  * "A P\xE1tria de Chuteiras" (a na\xE7\xE3o inteira batendo no peito com orgulho).
  * "A multid\xE3o uivante", "Gravata florid\xEDssima", "A chuteira sagrada", "A joelhada da provid\xEAncia".
- Use adjetivos grandiosos e dram\xE1ticos: "sublime", "pavoroso", "epopeia monumental", "cegueira de paix\xE3o", "espet\xE1culo dantesco", "milagre das multid\xF5es".
- Escreva cr\xF4nicas de um lirismo arrebatador, com met\xE1foras teatrais, di\xE1logos dram\xE1ticos simulados e uma paix\xE3o avassaladora pela bola e pelo personagem.`
  }
};
var isApiKeyValid = (key) => {
  if (!key || typeof key !== "string") return false;
  const k = key.trim();
  return k !== "" && k !== "undefined" && k !== "null" && k !== "MY_GEMINI_API_KEY" && k.length > 10;
};
app.post("/api/gemini/generate", async (req, res) => {
  const { journalistId, settings, period, entries } = req.body;
  const provider = req.headers["x-ai-provider"] || settings?.aiProvider || "gemini";
  let apiKey = null;
  if (provider === "openai") {
    const clientKey = req.headers["x-openai-key"] || settings?.openaiApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.OPENAI_API_KEY)) {
      apiKey = process.env.OPENAI_API_KEY.trim();
    }
    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API da OpenAI (ChatGPT) n\xE3o configurada ou inv\xE1lida! Clique no bot\xE3o de chave \u{1F511} no canto superior direito e insira sua chave da OpenAI (sk-...)."
      });
    }
  } else if (provider === "anthropic") {
    const clientKey = req.headers["x-anthropic-key"] || settings?.anthropicApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.ANTHROPIC_API_KEY)) {
      apiKey = process.env.ANTHROPIC_API_KEY.trim();
    }
    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API da Anthropic (Claude) n\xE3o configurada ou inv\xE1lida! Clique no bot\xE3o de chave \u{1F511} no canto superior direito e insira sua chave da Anthropic (sk-ant-...)."
      });
    }
  } else {
    const clientKey = req.headers["x-gemini-key"] || settings?.customApiKey;
    if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
      apiKey = clientKey.trim();
    } else if (isApiKeyValid(process.env.GEMINI_API_KEY)) {
      apiKey = process.env.GEMINI_API_KEY.trim();
    }
    if (!apiKey) {
      return res.status(400).json({
        error: "Chave de API do Gemini n\xE3o configurada ou inv\xE1lida! Por favor, clique no bot\xE3o de chave \u{1F511} no canto superior direito e insira sua chave obtida gratuitamente no Google AI Studio."
      });
    }
  }
  if (!settings || !journalistId || !period || !entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({
      error: "Dados incompletos para a gera\xE7\xE3o da revista."
    });
  }
  const persona = journalistPersonas[journalistId] || journalistPersonas["pvc"];
  try {
    const careerTypeText = settings.careerType === "player" ? "Jogador" : "Treinador (Manager)";
    const systemInstruction = `
${persona.instruction}

INFORMA\xC7\xD5ES DA CARREIRA NO EA FC:
- Nome do Personagem: ${settings.characterName}
- Tipo de Carreira: ${careerTypeText}
- Time Atual: ${settings.teamName}
- Temporada: ${req.body.season || settings.season}

PER\xCDODO DESTA REVISTA: ${period} (Temporada ${req.body.season || settings.season})

Voc\xEA \xE9 o editor-chefe de uma revista de esportes de prest\xEDgio. Voc\xEA deve escrever uma edi\xE7\xE3o completa com v\xE1rias p\xE1ginas (artigos de prosa bem longos, bem escritos, dram\xE1ticos e cheios de detalhes) baseando-se nos acontecimentos da linha do tempo fornecida abaixo pelo usu\xE1rio.
A revista deve conter:
1. Um t\xEDtulo espetacular na capa alinhado ao seu tom jornal\xEDstico e personalidade.
2. Um subt\xEDtulo marcante.
3. Um texto editorial de introdu\xE7\xE3o assinado por voc\xEA (jornalista).
4. P\xE1ginas de mat\xE9rias em profundidade. Voc\xEA DEVE criar EXATAMENTE uma p\xE1gina de mat\xE9ria para CADA registro fornecido na linha do tempo abaixo (um para cada ID de registro). N\xC3O fa\xE7a textos resumidos nem gen\xE9ricos; seja prolixo e extremamente rico em detalhes t\xE1ticos, sentimentos, estat\xEDsticas e descri\xE7\xF5es po\xE9ticas!
5. Cada p\xE1gina de mat\xE9ria deve corresponder a um registro de destaque da linha do tempo (definido em 'suggestedEntryId'). Voc\xEA DEVE usar a imagem ou frame de v\xEDdeo anexado a esse registro para descrever fielmente os detalhes visuais da jogada ou foto na sua cr\xF4nica.

REGRAS CR\xCDTICAS DE ORDENA\xC7\xC3O E INCLUS\xC3O COMPLETA (MANDAT\xD3RIO):
- **INCLUS\xC3O OBRIGAT\xD3RIA DE TODOS OS REGISTROS**: Voc\xEA DEVE criar EXATAMENTE uma p\xE1gina de mat\xE9ria no array de 'pages' do JSON para CADA registro fornecido na lista do prompt. N\xE3o pule nem junte registros diferentes em uma s\xF3 p\xE1gina! Se o usu\xE1rio enviou 3 registros, o array 'pages' deve ter exatamente 3 p\xE1ginas. Se enviou 5, deve ter exatamente 5 p\xE1ginas.
- **ORDEM CRONOL\xD3GICA RIGOROSA**: As p\xE1ginas de mat\xE9ria geradas no array 'pages' do JSON devem respeitar estritamente a mesma ordem sequencial dos registros fornecidos (do primeiro registro enviado para o \xFAltimo). O primeiro registro do prompt deve ser a primeira p\xE1gina de mat\xE9ria ('pageNumber' subsequente \xE0 capa e editorial), o segundo registro deve ser a segunda p\xE1gina, e assim sucessivamente. NUNCA misture, inverta ou embaralhe a ordem cronol\xF3gica dos fatos!

REGRAS CR\xCDTICAS DE AN\xC1LISE DE M\xCDDIA E PREVEN\xC7\xC3O DE ALUCINA\xC7\xC3O (MANDAT\xD3RIO):
- **PROIBIDO QUALQUER RECUSA DE AN\xC1LISE DE V\xCDDEO**: Quando o tipo de m\xEDdia for rotulado como 'V\xEDdeo' ou 'Frame de V\xEDdeo', voc\xEA est\xE1 recebendo uma IMAGEM EST\xC1TICA (FRAME/SCREENSHOT) extra\xEDda da grava\xE7\xE3o do jogo. Voc\xEA est\xE1 TERMINANTEMENTE PROIBIDO de dizer que 'n\xE3o pode assistir ao v\xEDdeo', que 'como IA n\xE3o tem acesso a arquivos de v\xEDdeo', ou que 'n\xE3o consegue analisar o lance por ser um v\xEDdeo'. Trate essa imagem est\xE1tica como a captura do instante mais precioso do lance, e use-a em conjunto com a descri\xE7\xE3o fornecida para criar uma cr\xF4nica futebol\xEDstica perfeita, rica e imersiva, agindo como se estivesse analisando o lance completo na TV!
- **FIDELIDADE ABSOLUTA AOS FATOS E RESULTADOS (PROIBIDO INVENTAR VIT\xD3RIAS OU OCULTAR DERROTAS)**: Voc\xEA N\xC3O PODE, sob hip\xF3tese alguma, transformar derrotas, empates ou elimina\xE7\xF5es em vit\xF3rias ou classifica\xE7\xF5es! Se a descri\xE7\xE3o em texto do usu\xE1rio relatar derrota, elimina\xE7\xE3o de copa, desclassifica\xE7\xE3o, perda de p\xEAnalti, cansa\xE7o, demiss\xE3o ou qualquer momento negativo, a mat\xE9ria correspondente DEVE focar 100% nisso com o tom correto. Escreva uma cr\xF4nica jornal\xEDstica dram\xE1tica, triste, de lamento ou cr\xEDtica t\xE1tica dura sobre a queda e a perda do objetivo (ex: desclassifica\xE7\xE3o). Nunca invente que o jogador se classificou ou venceu! O realismo do modo carreira depende de contar o drama das derrotas e a dor da desclassifica\xE7\xE3o com a mesma paix\xE3o e seriedade de um t\xEDtulo!
- **SEJA UM DETETIVE DO PLACAR (OCR DE PLACAR)**: Examine meticulosamente cada imagem ou frame de v\xEDdeo enviado. Procure por placares (scoreboards) virtuais t\xEDpicos de EA FC / FIFA (geralmente no canto superior esquerdo, superior central, ou nas telas de estat\xEDsticas de fim de jogo). Extraia os n\xFAmeros exatos e os nomes dos times exibidos. Se o placar estiver vis\xEDvel na imagem, voc\xEA DEVE citar esses n\xFAmeros exatos na cr\xF4nica.
- **AN\xC1LISE VISUAL DO V\xCDDEO/LANCE (RESULTADO FINAL OU COMEMORA\xC7\xC3O)**: Os frames de v\xEDdeo enviados representam momentos estrat\xE9gicos selecionados pelo usu\xE1rio, enfatizando ou a **tela do resultado final do jogo (placar final e estat\xEDsticas)** ou a **comemora\xE7\xE3o de gol do personagem**. Exauste o exame visual desse frame: cite o placar exato exibido ou descreva o gesto e a vibra\xE7\xE3o da comemora\xE7\xE3o na cr\xF4nica esportiva.
- **N\xC3O IGNORE OS REGISTROS NEGATIVOS**: Cada registro (seja vit\xF3ria, derrota, les\xE3o, demiss\xE3o ou transfer\xEAncia frustrada) deve receber uma p\xE1gina exclusiva de mat\xE9ria dedicada a ele. D\xEA o mesmo peso e profundidade jornal\xEDstica aos momentos dif\xEDceis e derrotas que voc\xEA d\xE1 \xE0s grandes vit\xF3rias. Cr\xEDticas \xE1cidas, lamentos po\xE9ticos e li\xE7\xF5es t\xE1ticas duras enriquecem a cr\xF4nica do seu jornalista!

Gere o resultado estritamente no esquema JSON solicitado.
`;
    const contentsPartsGemini = [];
    const openAiContentParts = [];
    const anthropicContentParts = [];
    const userPromptIntro = `Ol\xE1, meu caro jornalista! Escreva para mim a edi\xE7\xE3o da revista referente ao per\xEDodo: "${period}".

Aqui est\xE1 a lista cronol\xF3gica de acontecimentos e registros da minha carreira neste per\xEDodo. Por favor, analise a descri\xE7\xE3o em texto de cada registro e, PRINCIPALMENTE, examine as m\xEDdias (fotos ou frames de v\xEDdeo) que anexei inline em cada registro correspondente para descrever com precis\xE3o visual os lances, placares e emo\xE7\xF5es na sua cr\xF4nica esportiva:
`;
    contentsPartsGemini.push({ text: userPromptIntro });
    openAiContentParts.push({ type: "text", text: userPromptIntro });
    anthropicContentParts.push({ type: "text", text: userPromptIntro });
    entries.forEach((entry, index) => {
      const hasVideoFrames = entry.videoFrames && Array.isArray(entry.videoFrames) && entry.videoFrames.length > 0;
      const hasGallery = entry.galleryUrls && Array.isArray(entry.galleryUrls) && entry.galleryUrls.length > 0;
      const hasHtml = Boolean(entry.htmlCode && entry.htmlCode.trim());
      const mediaTypeLabel = hasHtml ? "C\xF3digo HTML / Apresenta\xE7\xE3o Canvas Incorporada" : hasGallery ? `Carrossel / Galeria de Imagens (${entry.galleryUrls.length} fotos)` : hasVideoFrames ? "V\xEDdeo (Sequ\xEAncia de frames/cenas cronol\xF3gicas extra\xEDdas do v\xEDdeo completo)" : entry.mediaType === "video" ? "Frame Est\xE1tico de V\xEDdeo (Screenshot)" : "Imagem/Screenshot";
      const entryText = `
--- REGISTRO #${index + 1} ---
ID: ${entry.id}
T\xEDtulo: ${entry.title}
M\xEAs na Temporada: ${entry.month}
Tipo de Evento: ${entry.type}
Tipo de M\xEDdia Anexa: ${mediaTypeLabel}
Descri\xE7\xE3o do Usu\xE1rio: ${entry.description}
Possui C\xF3digo HTML / Canvas Incorporado: ${hasHtml ? "Sim" : "N\xE3o"}
Possui Carrossel de M\xFAltiplas Fotos: ${hasGallery ? "Sim" : "N\xE3o"}
Possui Sequ\xEAncia de Cenas de V\xEDdeo: ${hasVideoFrames ? "Sim" : "N\xE3o"}
Possui Imagem/Thumbnail adicional: ${entry.mediaBase64 ? "Sim" : "N\xE3o"}

ATEN\xC7\xC3O CR\xCDTICA DO JORNALISTA PARA O REGISTRO #${index + 1}:
1. **AN\xC1LISE FIEL DOS RESULTADOS**: Voc\xEA DEVE ler com aten\xE7\xE3o a descri\xE7\xE3o acima e examinar todas as m\xEDdias anexadas (fotos, carrossel de imagens, c\xF3digo HTML/Canvas ou sequ\xEAncia do v\xEDdeo). Se o usu\xE1rio relatar derrota, elimina\xE7\xE3o, desclassifica\xE7\xE3o, perda de p\xEAnalti ou qualquer frustra\xE7\xE3o (ou se isso estiver vis\xEDvel nas imagens/HTML), a mat\xE9ria correspondente DEVE focar totalmente na DERROTA ou elimina\xE7\xE3o de forma dram\xE1tica, melanc\xF3lica, com sentimento de lamento ou cr\xEDtica t\xE1tica sincera e exigente sobre a queda do time. \xC9 TERMINANTEMENTE PROIBIDO inventar vit\xF3rias ou fingir que o time se classificou! O realismo do modo carreira exige reportar a queda e a tristeza da desclassifica\xE7\xE3o de forma s\xE9ria e profunda.
2. **AN\xC1LISE DE HTML / CANVAS**: Se houver um C\xF3digo HTML ou apresenta\xE7\xE3o Canvas anexado, analise minuciosamente todas as informa\xE7\xF5es, textos, gr\xE1ficos, dados ou slides nele descritos e incorpore esses insights e estat\xEDsticas no seu artigo jornal\xEDstico.
3. **DETALHES DO CARROSSEL DE FOTOS**: Se houver um carrossel com m\xFAltiplas fotos, observe cada uma das fotos para comentar a sequ\xEAncia dos momentos e rea\xE7\xF5es na mat\xE9ria!
`;
      contentsPartsGemini.push({ text: entryText });
      openAiContentParts.push({ type: "text", text: entryText });
      anthropicContentParts.push({ type: "text", text: entryText });
      if (hasHtml) {
        const htmlIntro = `[C\xD3DIGO HTML / APRESENTA\xC7\xC3O CANVAS DO REGISTRO #${index + 1} (ID: "${entry.id}") - IN\xCDCIO. Analise os textos e elementos do HTML abaixo:]
\`\`\`html
${entry.htmlCode}
\`\`\`
[FIM DO C\xD3DIGO HTML DO REGISTRO #${index + 1}.]`;
        contentsPartsGemini.push({ text: htmlIntro });
        openAiContentParts.push({ type: "text", text: htmlIntro });
        anthropicContentParts.push({ type: "text", text: htmlIntro });
      }
      if (hasGallery) {
        const galIntro = `[CARROSSEL DE IMAGENS DO REGISTRO #${index + 1} (ID: "${entry.id}") - ${entry.galleryUrls.length} FOTOS EM GALERIA - IN\xCDCIO.]`;
        contentsPartsGemini.push({ text: galIntro });
        openAiContentParts.push({ type: "text", text: galIntro });
        anthropicContentParts.push({ type: "text", text: galIntro });
        entry.galleryUrls.forEach((gUrl, gIdx) => {
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
        const vidIntro = `[V\xCDDEO DO REGISTRO #${index + 1} (ID: "${entry.id}") - CENAS CHAVE SEQUENCIAIS EM ORDEM CRONOL\xD3GICA - IN\xCDCIO. Analise as imagens abaixo para entender o desenrolar completo da jogada:]`;
        contentsPartsGemini.push({ text: vidIntro });
        openAiContentParts.push({ type: "text", text: vidIntro });
        anthropicContentParts.push({ type: "text", text: vidIntro });
        entry.videoFrames.forEach((frameBase64, frameIdx) => {
          const match = frameBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            const sceneLabel = `[Cena ${frameIdx + 1} de 5 do lance do v\xEDdeo:]`;
            contentsPartsGemini.push({ text: sceneLabel });
            contentsPartsGemini.push({ inlineData: { mimeType, data: base64Data } });
            openAiContentParts.push({ type: "text", text: sceneLabel });
            openAiContentParts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } });
            anthropicContentParts.push({ type: "text", text: sceneLabel });
            anthropicContentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } });
          }
        });
        const vidOutro = `[FIM DAS CENAS SEQUENCIAIS DO V\xCDDEO DO REGISTRO #${index + 1}.]`;
        contentsPartsGemini.push({ text: vidOutro });
        openAiContentParts.push({ type: "text", text: vidOutro });
        anthropicContentParts.push({ type: "text", text: vidOutro });
      }
      if (entry.mediaBase64) {
        const match = entry.mediaBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const imgIntro = `[IMAGEM/CAPTURA DO REGISTRO #${index + 1} (ID: "${entry.id}") - IN\xCDCIO.]`;
          const imgOutro = `[FIM DA IMAGEM DO REGISTRO #${index + 1}. Assinale os detalhes desta imagem na mat\xE9ria da p\xE1gina correspondente com 'suggestedEntryId' = "${entry.id}"]`;
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
Por favor, redija agora as mat\xE9rias completas seguindo com total fidelidade o seu estilo e os fatos descritos. Use e comente os detalhes visuais das m\xEDdias anexadas para enriquecer o texto. Lembre-se de retornar cada p\xE1gina com seu respectivo 'suggestedEntryId' correspondente para associar a foto \xE0 p\xE1gina correta na nossa revista.

Escreva artigos longos, dram\xE1ticos, t\xE1ticos e de alto n\xEDvel!
`;
    contentsPartsGemini.push({ text: userPromptOutro });
    openAiContentParts.push({ type: "text", text: userPromptOutro });
    anthropicContentParts.push({ type: "text", text: userPromptOutro });
    if (provider === "openai") {
      console.log("Processando gera\xE7\xE3o via OpenAI (ChatGPT)...");
      const openAiMessages = [
        {
          role: "system",
          content: systemInstruction + '\n\nVoc\xEA DEVE responder ESTRITAMENTE com um objeto JSON v\xE1lido no formato:\n{\n  "magazineTitle": "...",\n  "magazineSubtitle": "...",\n  "editorialText": "...",\n  "pages": [\n    {\n      "pageNumber": 1,\n      "title": "...",\n      "content": "...",\n      "caption": "...",\n      "suggestedEntryId": "..."\n    }\n  ]\n}'
        },
        { role: "user", content: openAiContentParts }
      ];
      const modelsToTry2 = ["gpt-4o-mini", "gpt-4o"];
      let rawText = "";
      let lastErr = null;
      for (const openAiModel of modelsToTry2) {
        try {
          console.log(`Tentando OpenAI com modelo ${openAiModel}...`);
          const response2 = await fetch("https://api.openai.com/v1/chat/completions", {
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
          const json = await response2.json();
          if (!response2.ok) {
            throw new Error(json.error?.message || `Erro da OpenAI (${response2.status})`);
          }
          rawText = json.choices?.[0]?.message?.content || "";
          if (rawText) break;
        } catch (err) {
          console.warn(`Erro na tentativa OpenAI (${openAiModel}):`, err.message);
          lastErr = err;
        }
      }
      if (!rawText) {
        throw lastErr || new Error("N\xE3o foi poss\xEDvel gerar a revista atrav\xE9s da OpenAI.");
      }
      const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const magazineData2 = JSON.parse(cleaned);
      return res.json(magazineData2);
    }
    if (provider === "anthropic") {
      console.log("Processando gera\xE7\xE3o via Anthropic (Claude)...");
      const anthropicMessages = [
        { role: "user", content: anthropicContentParts }
      ];
      const modelsToTry2 = ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"];
      let rawText = "";
      let lastErr = null;
      for (const claudeModel of modelsToTry2) {
        try {
          console.log(`Tentando Anthropic com modelo ${claudeModel}...`);
          const response2 = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: claudeModel,
              max_tokens: 8192,
              system: systemInstruction + "\n\nVoc\xEA DEVE responder ESTRITAMENTE e APENAS com um objeto JSON v\xE1lido contendo os campos: magazineTitle, magazineSubtitle, editorialText e pages (array com objetos contendo pageNumber, title, content, caption, suggestedEntryId).",
              messages: anthropicMessages
            })
          });
          const json = await response2.json();
          if (!response2.ok) {
            throw new Error(json.error?.message || `Erro da Anthropic (${response2.status})`);
          }
          rawText = json.content?.[0]?.text || "";
          if (rawText) break;
        } catch (err) {
          console.warn(`Erro na tentativa Anthropic (${claudeModel}):`, err.message);
          lastErr = err;
        }
      }
      if (!rawText) {
        throw lastErr || new Error("N\xE3o foi poss\xEDvel gerar a revista atrav\xE9s da Anthropic.");
      }
      const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const magazineData2 = JSON.parse(cleaned);
      return res.json(magazineData2);
    }
    let currentApiKey = apiKey;
    let ai = new import_genai.GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const responseSchema = {
      type: import_genai.Type.OBJECT,
      properties: {
        magazineTitle: {
          type: import_genai.Type.STRING,
          description: "T\xEDtulo principal marcante e po\xE9tico para a capa da revista esportiva."
        },
        magazineSubtitle: {
          type: import_genai.Type.STRING,
          description: "Subt\xEDtulo atraente de capa detalhando a grande hist\xF3ria."
        },
        editorialText: {
          type: import_genai.Type.STRING,
          description: "Texto editorial/carta de abertura do jornalista, refletindo sobre o per\xEDodo com sua assinatura t\xEDpica."
        },
        pages: {
          type: import_genai.Type.ARRAY,
          description: "A lista de p\xE1ginas da revista. Voc\xEA DEVE incluir exatamente 1 p\xE1gina de mat\xE9ria para cada registro da timeline fornecido no prompt, mantendo exatamente a mesma ordem cronol\xF3gica sequencial em que foram listados (do primeiro para o \xFAltimo registro).",
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              pageNumber: { type: import_genai.Type.INTEGER },
              title: {
                type: import_genai.Type.STRING,
                description: "T\xEDtulo marcante da p\xE1gina ou cap\xEDtulo da mat\xE9ria."
              },
              content: {
                type: import_genai.Type.STRING,
                description: "O texto completo do artigo jornal\xEDstico em formato Markdown. Deve conter v\xE1rios par\xE1grafos, ser rico em detalhes e emular perfeitamente o jornalista. N\xE3o resuma!"
              },
              caption: {
                type: import_genai.Type.STRING,
                description: "Legenda de foto de jornalismo esportivo para esta p\xE1gina."
              },
              suggestedEntryId: {
                type: import_genai.Type.STRING,
                description: "O ID exato do registro correspondente da linha do tempo. A ordem sequencial das p\xE1ginas geradas deve respeitar estritamente a ordem que os registros foram listados no prompt."
              }
            },
            required: ["pageNumber", "title", "content", "caption", "suggestedEntryId"]
          }
        }
      },
      required: ["magazineTitle", "magazineSubtitle", "editorialText", "pages"]
    };
    let response = null;
    let lastError = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    if (currentApiKey && currentApiKey !== process.env.GEMINI_API_KEY) {
      modelsToTry.unshift("gemini-3.1-pro-preview");
    }
    for (const modelToUse of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Tentando gerar conte\xFAdo com o modelo ${modelToUse} (Tentativa ${attempt}/2)...`);
          const genResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: { parts: contentsPartsGemini },
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.85
            }
          });
          if (genResponse && genResponse.text) {
            response = genResponse;
            break;
          }
        } catch (err) {
          lastError = err;
          const errStr = String(err.message || err);
          console.warn(`Erro com o modelo ${modelToUse} na tentativa ${attempt}:`, errStr);
          if (currentApiKey !== process.env.GEMINI_API_KEY && isApiKeyValid(process.env.GEMINI_API_KEY) && (errStr.includes("PERMISSION_DENIED") || errStr.includes("denied access") || errStr.includes("403") || errStr.includes("401") || errStr.includes("UNAUTHENTICATED") || errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errStr.includes("API_KEY_INVALID"))) {
            console.warn("Chave de API personalizada falhou na autentica\xE7\xE3o ou permiss\xE3o. Trocando para a chave do sistema...");
            currentApiKey = process.env.GEMINI_API_KEY;
            ai = new import_genai.GoogleGenAI({
              apiKey: currentApiKey,
              httpOptions: {
                headers: {
                  "User-Agent": "aistudio-build"
                }
              }
            });
            attempt--;
            continue;
          }
          if (modelToUse === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      if (response) {
        break;
      }
    }
    if (!response || !response.text) {
      throw lastError || new Error("N\xE3o foi poss\xEDvel obter resposta de nenhum modelo Gemini.");
    }
    const responseText = response.text;
    const magazineData = JSON.parse(responseText.trim());
    return res.json(magazineData);
  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    const errStr = (JSON.stringify(error) + " " + String(error.message || error)).toUpperCase();
    let userFriendlyError = "Ocorreu um erro ao gerar a narrativa com a IA do Gemini. Detalhes: " + (error.message || error);
    if (errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errStr.includes("API_KEY_INVALID")) {
      userFriendlyError = `Chave de API do Gemini inv\xE1lida ou n\xE3o autorizada (Erro de Autentica\xE7\xE3o 401)! 

Por favor, verifique a chave de API configurada:
1. Clique no bot\xE3o de chave \u{1F511} (Chave de API) ou de engrenagem \u2699\uFE0F (Configura\xE7\xF5es) no canto superior direito da tela.
2. Certifique-se de que inseriu uma chave de API v\xE1lida obtida gratuitamente no Google AI Studio (https://aistudio.google.com/).
3. Se voc\xEA n\xE3o inseriu uma chave personalizada, a chave compartilhada do sistema pode estar inst\xE1vel ou desativada temporariamente. Nesse caso, criar sua pr\xF3pria chave gratuita no Google AI Studio resolver\xE1 o problema instantaneamente!`;
    } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("QUOTA") || errStr.includes("PREPAYMENT CREDITS") || errStr.includes("429") || errStr.includes("DEPLETED") || errStr.includes("LIMIT")) {
      userFriendlyError = `Cr\xE9ditos temporariamente indispon\xEDveis! Os cr\xE9ditos compartilhados de intelig\xEAncia artificial do desenvolvedor foram esgotados devido ao alt\xEDssimo n\xFAmero de revistas geradas hoje.

Para continuar escrevendo cr\xF4nicas detalhadas e ilimitadas agora mesmo e de forma 100% gratuita, basta configurar sua pr\xF3pria Chave de API individual:

1. Clique no bot\xE3o de engrenagem \u2699\uFE0F (Configura\xE7\xF5es) no canto superior direito da tela.
2. Acesse o Google AI Studio (https://aistudio.google.com/) para obter uma Chave de API gr\xE1tis em 30 segundos (clique em "Get API Key").
3. Cole sua chave no campo correspondente e salve!

Isso ativar\xE1 uma cota de processamento dedicada, r\xE1pida e gratuita s\xF3 para voc\xEA.`;
    }
    return res.status(500).json({
      error: userFriendlyError
    });
  }
});
app.post("/api/gemini/regenerate-page", async (req, res) => {
  const { journalistId, settings, page, userCorrection, entry } = req.body;
  const clientKey = req.headers["x-gemini-key"];
  let apiKey = null;
  if (clientKey && typeof clientKey === "string" && isApiKeyValid(clientKey)) {
    apiKey = clientKey.trim();
  }
  if (!apiKey && isApiKeyValid(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY.trim();
  }
  if (!apiKey) {
    return res.status(400).json({
      error: "Chave de API do Gemini n\xE3o configurada ou inv\xE1lida! Por favor, clique no bot\xE3o de chave \u{1F511} (Chave de API) ou de engrenagem \u2699\uFE0F (Configura\xE7\xF5es) no canto superior direito e insira sua chave obtida gratuitamente no Google AI Studio."
    });
  }
  if (!settings || !journalistId || !page || !userCorrection) {
    return res.status(400).json({
      error: "Dados incompletos para a regenera\xE7\xE3o da mat\xE9ria."
    });
  }
  const persona = journalistPersonas[journalistId] || journalistPersonas["pvc"];
  try {
    let currentApiKey = apiKey;
    let ai = new import_genai.GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const careerTypeText = settings.careerType === "player" ? "Jogador" : "Treinador (Manager)";
    const systemInstruction = `
${persona.instruction}

INFORMA\xC7\xD5ES DA CARREIRA NO EA FC:
- Nome do Personagem: ${settings.characterName}
- Tipo de Carreira: ${careerTypeText}
- Time Atual: ${settings.teamName}
- Temporada: ${settings.season}

Voc\xEA \xE9 o jornalista esportivo contratado. O usu\xE1rio identificou que houve uma ALUCINA\xC7\xC3O ou ERRO de interpreta\xE7\xE3o na mat\xE9ria que voc\xEA escreveu para a p\xE1gina ${page.pageNumber}.
Voc\xEA DEVE reescrever e corrigir ESSA MAT\xC9RIA ESPEC\xCDFICA com base nas novas instru\xE7\xF5es e corre\xE7\xF5es t\xE1ticas fornecidas pelo usu\xE1rio abaixo.

REGRAS CR\xCDTICAS DE CORRE\xC7\xC3O:
1. **FIDELIDADE TOTAL \xC0 CORRE\xC7\xC3O DO USU\xC1RIO**: A instru\xE7\xE3o corretiva do usu\xE1rio \xE9 a sua diretriz m\xE1xima. Se o usu\xE1rio diz que o time PERDEU, que o lance foi contra, ou explica detalhes espec\xEDficos da jogada (quem fez o gol, quem falhou), voc\xEA DEVE incorporar esses fatos com precis\xE3o absoluta, emulando perfeitamente o seu estilo jornal\xEDstico. \xC9 proibido ignorar a corre\xE7\xE3o do usu\xE1rio!
2. **MANTER O ESTILO PERSONA**: Continue escrevendo no mesmo tom e persona de ${persona.name}. Seja prolixo, escreva cr\xF4nicas profundas, emotivas e ricas em termos t\xE1ticos e po\xE9ticos.
3. **Markdown**: Retorne o conte\xFAdo do artigo no campo 'content' utilizando formato Markdown rico e longo.

Gere o resultado estritamente no esquema JSON solicitado.
`;
    const contentsParts = [];
    let promptText = `Ol\xE1, meu caro jornalista!
Por favor, REESCREVA e CORRIJA a mat\xE9ria da p\xE1gina ${page.pageNumber}.

MAT\xC9RIA ANTERIOR (COM ERRO):
T\xEDtulo: ${page.title}
Conte\xFAdo Anterior: 
${page.content}
Legenda Anterior: ${page.caption}

REGISTRO DA TIMELINE CORRESPONDENTE:
ID: ${page.suggestedEntryId}
${entry ? `T\xEDtulo do Registro: ${entry.title}
Descri\xE7\xE3o Inicial do Usu\xE1rio: ${entry.description}
Tipo de Evento: ${entry.type}
M\xEAs: ${entry.month}` : "Nenhum registro extra fornecido."}

AQUI EST\xC1 A CORRE\xC7\xC3O CRUCIAL QUE VOC\xCA DEVE SEGUIR:
"${userCorrection}"

Por favor, reescreva a mat\xE9ria inteira corrigindo as alucina\xE7\xF5es e mantendo o seu estilo brilhante.
`;
    contentsParts.push({ text: promptText });
    if (entry) {
      const hasVideoFrames = entry.videoFrames && Array.isArray(entry.videoFrames) && entry.videoFrames.length > 0;
      if (hasVideoFrames) {
        contentsParts.push({
          text: `[RE-AN\xC1LISE DE V\xCDDEO - CENAS CHAVE SEQUENCIAIS EM ORDEM CRONOL\xD3GICA - IN\xCDCIO. Analise as imagens para alinhar com a nova corre\xE7\xE3o:]`
        });
        entry.videoFrames.forEach((frameBase64, frameIdx) => {
          const match = frameBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            contentsParts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            });
          }
        });
        contentsParts.push({
          text: `[FIM DAS CENAS SEQUENCIAIS DO V\xCDDEO]`
        });
      }
      if (entry.mediaUrl) {
        const match = entry.mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          contentsParts.push({
            text: `[RE-AN\xC1LISE DE CAPTURA VISUAL - IN\xCDCIO]`
          });
          contentsParts.push({
            inlineData: {
              mimeType,
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
      type: import_genai.Type.OBJECT,
      properties: {
        title: {
          type: import_genai.Type.STRING,
          description: "O novo t\xEDtulo marcante para esta mat\xE9ria."
        },
        caption: {
          type: import_genai.Type.STRING,
          description: "A nova legenda para a imagem desta mat\xE9ria."
        },
        content: {
          type: import_genai.Type.STRING,
          description: "O texto reescrito completo em formato Markdown, incorporando a corre\xE7\xE3o e mantendo o estilo marcante."
        }
      },
      required: ["title", "caption", "content"]
    };
    let response = null;
    let lastError = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    if (currentApiKey && currentApiKey !== process.env.GEMINI_API_KEY) {
      modelsToTry.unshift("gemini-3.1-pro-preview");
    }
    for (const modelToUse of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Tentando REGENERAR mat\xE9ria com o modelo ${modelToUse} (Tentativa ${attempt}/2)...`);
          const genResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: { parts: contentsParts },
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.8
            }
          });
          if (genResponse && genResponse.text) {
            response = genResponse;
            break;
          }
        } catch (err) {
          lastError = err;
          const errStr = String(err.message || err);
          console.warn(`Erro na regenera\xE7\xE3o com o modelo ${modelToUse} na tentativa ${attempt}:`, errStr);
          if (currentApiKey !== process.env.GEMINI_API_KEY && isApiKeyValid(process.env.GEMINI_API_KEY) && (errStr.includes("PERMISSION_DENIED") || errStr.includes("denied access") || errStr.includes("403") || errStr.includes("401") || errStr.includes("UNAUTHENTICATED") || errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errStr.includes("API_KEY_INVALID"))) {
            console.warn("Chave de API personalizada falhou na autentica\xE7\xE3o ou permiss\xE3o ao regenerar. Trocando para a chave do sistema...");
            currentApiKey = process.env.GEMINI_API_KEY;
            ai = new import_genai.GoogleGenAI({
              apiKey: currentApiKey,
              httpOptions: {
                headers: {
                  "User-Agent": "aistudio-build"
                }
              }
            });
            attempt--;
            continue;
          }
          if (modelToUse === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      if (response) {
        break;
      }
    }
    if (!response || !response.text) {
      throw lastError || new Error("N\xE3o foi poss\xEDvel obter resposta do Gemini.");
    }
    const responseText = response.text;
    const regeneratedPage = JSON.parse(responseText.trim());
    return res.json(regeneratedPage);
  } catch (error) {
    console.error("Erro na API do Gemini ao regenerar p\xE1gina:", error);
    const errStr = (JSON.stringify(error) + " " + String(error.message || error)).toUpperCase();
    let userFriendlyError = "Ocorreu um erro ao regenerar a mat\xE9ria com o Gemini: " + (error.message || error);
    if (errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errStr.includes("API_KEY_INVALID")) {
      userFriendlyError = `Chave de API do Gemini inv\xE1lida ou n\xE3o autorizada (Erro de Autentica\xE7\xE3o 401)! 

Por favor, verifique a chave de API configurada nas Configura\xE7\xF5es (\xEDcone de engrenagem \u2699\uFE0F no canto superior direito). Certifique-se de que inseriu uma chave de API v\xE1lida obtida gratuitamente no Google AI Studio (https://aistudio.google.com/).`;
    }
    return res.status(500).json({
      error: userFriendlyError
    });
  }
});
async function startServer() {
  app.get("/firebase-applet-config.json", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), "firebase-applet-config.json"));
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
