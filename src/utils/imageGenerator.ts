/**
 * Dynamic Canvas Image Generator
 * Generates beautiful, high-quality, soccer-themed graphic cards at runtime.
 * Bypasses broken external URL dependencies and creates a highly authentic EA FC vibe.
 */
import { TimelineEntry } from "../types";

export type GraphicType = 'stadium' | 'trophy' | 'fc_card' | 'tactical' | 'injury' | 'newspaper';

export function generateSportsGraphic(
  type: GraphicType, 
  title: string, 
  subtitle: string, 
  teamName: string = "FC", 
  playerName: string = "Jogador"
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Draw Background
  if (type === 'stadium' || type === 'fc_card' || type === 'trophy') {
    // Elegant dark soccer green/gold gradient
    const gradient = ctx.createRadialGradient(400, 225, 50, 400, 225, 450);
    gradient.addColorStop(0, '#10301d'); // Rich dark green
    gradient.addColorStop(1, '#05120a'); // Dark forest black
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // Draw football pitch line markings (aesthetic background lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 3;
    
    // Outer border
    ctx.strokeRect(30, 30, 740, 390);
    // Center line
    ctx.beginPath();
    ctx.moveTo(400, 30);
    ctx.lineTo(400, 420);
    ctx.stroke();
    // Center circle
    ctx.beginPath();
    ctx.arc(400, 225, 100, 0, Math.PI * 2);
    ctx.stroke();
    
    // Goal areas
    ctx.strokeRect(30, 112.5, 120, 225);
    ctx.strokeRect(650, 112.5, 120, 225);
  } else if (type === 'tactical') {
    // Blueprint tactical blue grid
    ctx.fillStyle = '#0a1d37';
    ctx.fillRect(0, 0, 800, 450);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 450);
      ctx.stroke();
    }
    for (let j = 0; j < 450; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }

    // Pitch markings in blue layout
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 720, 370);
    ctx.beginPath();
    ctx.arc(400, 225, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(400, 40);
    ctx.lineTo(400, 410);
    ctx.stroke();
  } else if (type === 'injury') {
    // Severe dark slate red theme
    const gradient = ctx.createLinearGradient(0, 0, 800, 450);
    gradient.addColorStop(0, '#2e0f12');
    gradient.addColorStop(1, '#0d0405');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // Grid details
    ctx.strokeStyle = 'rgba(217, 43, 52, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 800; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 450);
      ctx.stroke();
    }
  } else { // Newspaper / Editorial
    // Retro warm paper tone
    ctx.fillStyle = '#f4eedb';
    ctx.fillRect(0, 0, 800, 450);

    // Half-tone news column sketchlines
    ctx.fillStyle = '#eae2cd';
    ctx.fillRect(40, 160, 340, 250);
    ctx.fillRect(420, 160, 340, 250);
  }

  // 2. Draw Graphic Elements based on Type
  if (type === 'fc_card') {
    // Draw EA FC-style Card Shield in the center
    const cx = 150;
    const cy = 225;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;

    // Outer card glow/gold gradient
    const cardGrad = ctx.createLinearGradient(cx - 100, cy - 150, cx + 100, cy + 150);
    cardGrad.addColorStop(0, '#f1c40f'); // Gold
    cardGrad.addColorStop(0.5, '#f39c12'); // Amber
    cardGrad.addColorStop(1, '#d35400'); // Bronze
    ctx.fillStyle = cardGrad;
    
    // Draw shield shape
    ctx.beginPath();
    ctx.moveTo(cx, cy - 140);
    ctx.lineTo(cx + 90, cy - 100);
    ctx.lineTo(cx + 90, cy + 50);
    ctx.lineTo(cx, cy + 150);
    ctx.lineTo(cx - 90, cy + 50);
    ctx.lineTo(cx - 90, cy - 100);
    ctx.closePath();
    ctx.fill();

    // Inner card shape
    ctx.fillStyle = '#0d1d14';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 132);
    ctx.lineTo(cx + 82, cy - 94);
    ctx.lineTo(cx + 82, cy + 44);
    ctx.lineTo(cx, cy + 140);
    ctx.lineTo(cx - 82, cy + 44);
    ctx.lineTo(cx - 82, cy - 94);
    ctx.closePath();
    ctx.fill();

    // Draw gold accents inside card
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Player Text inside Card
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('94', cx, cy - 30); // Rating
    
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('OVR', cx, cy - 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(playerName.split(' ')[0].toUpperCase(), cx, cy + 25);

    ctx.fillStyle = '#f39c12';
    ctx.font = '10px monospace';
    ctx.fillText(teamName.toUpperCase(), cx, cy + 45);

    // Fake Attributes
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PAC 95 | SHO 93 | PAS 91', cx, cy + 75);
    ctx.fillText('DRI 96 | DEF 45 | PHY 82', cx, cy + 95);

    ctx.restore();
  } else if (type === 'trophy') {
    // Draw dynamic golden trophy graphic
    const tx = 180;
    const ty = 225;

    ctx.save();
    ctx.shadowColor = 'rgba(241, 196, 15, 0.4)';
    ctx.shadowBlur = 15;

    // Trophy Gold Gradient
    const gold = ctx.createLinearGradient(tx - 60, ty - 100, tx + 60, ty + 100);
    gold.addColorStop(0, '#ffe57f');
    gold.addColorStop(0.5, '#ffc107');
    gold.addColorStop(1, '#ff8f00');
    ctx.fillStyle = gold;

    // Draw Trophy cup
    ctx.beginPath();
    ctx.moveTo(tx - 50, ty - 80);
    ctx.lineTo(tx + 50, ty - 80);
    ctx.lineTo(tx + 40, ty);
    ctx.quadraticCurveTo(tx, ty + 40, tx, ty + 60); // base connector
    ctx.lineTo(tx + 25, ty + 60);
    ctx.lineTo(tx + 30, ty + 80);
    ctx.lineTo(tx - 30, ty + 80);
    ctx.lineTo(tx - 25, ty + 60);
    ctx.lineTo(tx, ty + 60);
    ctx.quadraticCurveTo(tx, ty + 40, tx - 40, ty);
    ctx.closePath();
    ctx.fill();

    // Trophy Handles
    ctx.strokeStyle = '#ffc107';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(tx - 42, ty - 40, 20, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx + 42, ty - 40, 20, Math.PI * 1.5, Math.PI * 0.5);
    ctx.stroke();

    // Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tx - 30, ty - 70, 3, 0, Math.PI * 2);
    ctx.arc(tx + 20, ty - 20, 2, 0, Math.PI * 2);
    ctx.arc(tx + 50, ty - 60, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (type === 'tactical') {
    // Draw some tactical circles and routes
    ctx.save();
    
    // Team dots
    ctx.fillStyle = '#ff3b30'; // red attacker
    ctx.beginPath(); ctx.arc(320, 225, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('9', 320, 229);

    // Defense dots
    ctx.fillStyle = '#007aff'; // blue defender 1
    ctx.beginPath(); ctx.arc(260, 180, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('4', 260, 184);

    ctx.fillStyle = '#007aff'; // blue defender 2
    ctx.beginPath(); ctx.arc(260, 270, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('3', 260, 274);

    // Arrow route
    ctx.strokeStyle = '#4cd964'; // green tactical run
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(320, 225);
    ctx.quadraticCurveTo(220, 225, 120, 225);
    ctx.stroke();

    // Goal representation
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(120, 225, 6, 0, Math.PI*2);
    ctx.fill();

    // Net target
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 185, 10, 80);

    ctx.restore();
  } else if (type === 'injury') {
    // Red Cross and heart pulses
    ctx.save();
    const cx = 180;
    const cy = 225;

    // Pulsing glow
    ctx.shadowColor = '#ff3b30';
    ctx.shadowBlur = 25;

    // Cross
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(cx - 15, cy - 45, 30, 90);
    ctx.fillRect(cx - 45, cy - 15, 90, 30);

    // Pulse EKG wave
    ctx.strokeStyle = 'rgba(255, 59, 48, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, 225);
    ctx.lineTo(340, 225);
    ctx.lineTo(350, 180);
    ctx.lineTo(365, 270);
    ctx.lineTo(380, 210);
    ctx.lineTo(390, 235);
    ctx.lineTo(405, 225);
    ctx.lineTo(450, 225);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Draw Typography & Layout (Unified look for titles)
  ctx.save();
  
  const textX = type === 'fc_card' || type === 'trophy' || type === 'injury' ? 340 : 80;
  const isLight = type === 'newspaper';
  
  // Vignette overlay
  if (!isLight) {
    const vignette = ctx.createLinearGradient(0, 0, 0, 450);
    vignette.addColorStop(0, 'rgba(0,0,0,0.1)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 800, 450);
  }

  // Title Box
  ctx.textAlign = 'left';
  
  // Accent badge/category
  ctx.fillStyle = isLight ? '#D92B34' : '#e67e22'; // Sports red vs gold/orange
  ctx.font = 'bold 12px monospace';
  ctx.fillText(type.toUpperCase() + ' // REGISTRO DE CARREIRA', textX, 100);

  // Main Title
  ctx.fillStyle = isLight ? '#111111' : '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  
  // Wrap text helper to prevent text overflow
  const words = title.split(' ');
  let line = '';
  let y = 145;
  const maxWidth = type === 'fc_card' || type === 'trophy' || type === 'injury' ? 420 : 640;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, textX, y);
      line = words[n] + ' ';
      y += 42;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, textX, y);

  // Subtitle/Caption
  ctx.fillStyle = isLight ? '#555555' : '#bdc3c7';
  ctx.font = '15px sans-serif';
  y += 20;

  const subWords = subtitle.split(' ');
  let subLine = '';
  for (let n = 0; n < subWords.length; n++) {
    const testLine = subLine + subWords[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(subLine, textX, y);
      subLine = subWords[n] + ' ';
      y += 24;
    } else {
      subLine = testLine;
    }
  }
  ctx.fillText(subLine, textX, y);

  // Footer Tag
  ctx.fillStyle = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
  ctx.font = '11px monospace';
  ctx.fillText(`${teamName.toUpperCase()} • ${playerName.toUpperCase()} • FC COMPANION`, textX, 390);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

export function generateSampleTimeline(teamName: string, playerName: string, season: string = "2024/2025"): TimelineEntry[] {
  return [
    {
      id: "sample_1",
      title: "Estreia Lendária na Temporada",
      description: "Uma estreia memorável no clássico de abertura. Saímos atrás no placar, mas empatamos com passe primoroso e, no último lance do jogo, marcamos um gol antológico de fora da área decretando a vitória por 2x1 com o estádio lotado debaixo de chuva intensa.",
      month: "Fevereiro",
      season: season,
      type: "match",
      mediaUrl: generateSportsGraphic('stadium', "Estreia Lendária com Gol de Placa", "O gol emocionante aos 93 minutos garantiu a vitória de virada sob aplausos de toda a torcida.", teamName, playerName),
      mediaType: "image",
      createdAt: Date.now() - 50000
    },
    {
      id: "sample_2",
      title: "Mudança Tática de Sucesso",
      description: "Implementamos uma mudança radical nos treinos passando para o esquema de marcação sob pressão alta com transições ultrarrápidas pelas pontas. O jogador se encaixou com maestria flutuando do meio para o ataque e quebramos a sequência de vitórias do líder do campeonato com um chocolate tático por 3x0.",
      month: "Março",
      season: season,
      type: "training",
      mediaUrl: generateSportsGraphic('tactical', "Chocolate Tático Rompe o Líder", "Estudo de posicionamento minucioso desmontou o sistema defensivo do adversário com maestria.", teamName, playerName),
      mediaType: "image",
      createdAt: Date.now() - 40000
    },
    {
      id: "sample_3",
      title: "Dramática Lesão no Joelho",
      description: "Momento de extrema apreensão. No auge da temporada, após uma dividida forte na intermediária de ataque, o atleta sentiu o joelho e precisou sair de maca. Os exames de imagem confirmaram um estiramento leve de ligamento, afastando-nos do campo de jogo pelas próximas 4 semanas. A equipe precisará se superar.",
      month: "Maio",
      season: season,
      type: "injury",
      mediaUrl: generateSportsGraphic('injury', "O Grito de Dor do Artilheiro", "O estiramento confirmado preocupa o departamento médico e acende o sinal de alerta para a temporada.", teamName, playerName),
      mediaType: "image",
      createdAt: Date.now() - 30000
    },
    {
      id: "sample_4",
      title: "Eleito Jogador do Mês",
      description: "A volta por cima triunfal! Após o retorno da lesão, marcamos 6 gols em 4 jogos, incluindo um hat-trick formidável. O desempenho avassalador rendeu o prêmio oficial de Jogador do Mês da Liga, coroando a superação física e mental e elevando nossa moral ao patamar mais alto do cenário esportivo.",
      month: "Julho (Janela do Meio do Ano)",
      season: season,
      type: "award",
      mediaUrl: generateSportsGraphic('fc_card', "Coroado o Melhor do Mês", "Prêmio oficial consagra a incrível recuperação pós-lesão com números assombrosos nos gramados.", teamName, playerName),
      mediaType: "image",
      createdAt: Date.now() - 20000
    },
    {
      id: "sample_5",
      title: "A Consagração do Título com Glória Eterna",
      description: "A partida da nossa vida. Grande final do campeonato valendo a taça mais cobiçada. Um jogo truncado que se arrastou até a prorrogação. Com persistência inacreditável e no limite físico, estufamos as redes na cobrança de falta perfeita, coroando uma campanha lendária com a medalha de ouro no peito e o troféu erguido para o céu!",
      month: "Novembro (Finais de Temporada)",
      season: season,
      type: "match",
      mediaUrl: generateSportsGraphic('trophy', "A Glória Eterna Escrita em Ouro", "Com um desfecho heróico na prorrogação, erguemos o cobiçado troféu para as páginas douradas da história.", teamName, playerName),
      mediaType: "image",
      createdAt: Date.now() - 10000
    }
  ];
}
