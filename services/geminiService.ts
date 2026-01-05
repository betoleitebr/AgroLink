
import { GoogleGenAI, Type } from "@google/genai";
import { ConversationNote } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRTVReport = async (notes: string, cropType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um agrônomo especialista sênior. Com base nas seguintes notas de campo para uma cultura de ${cropType}, gere um resumo profissional de visita técnica e recomendações estratégicas para o produtor rural.
      Notas de Campo: ${notes}
      
      IMPORTANTE: Responda obrigatoriamente em Português do Brasil.
      Responda em formato JSON com dois campos: "summary" (um parágrafo curto e direto) e "recommendations" (uma lista com 3 a 4 pontos práticos).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "recommendations"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Erro ao gerar relatório RTV:", error);
    return {
      summary: "Visita concluída. Análise detalhada pendente de sincronização.",
      recommendations: [
        "Monitorar atividade de pragas nos próximos 5 dias",
        "Reavaliar cronograma de irrigação",
        "Verificar níveis de umidade do solo no talhão"
      ]
    };
  }
};

export const generateFieldDeepAnalysis = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Você é um Cientista de Dados Agrícolas e Estrategista. Analise os dados deste talhão e forneça um diagnóstico de performance.
      
      DADOS DO TALHÃO:
      - Nome: ${data.name} | Cultura: ${data.cropType}
      - Eficiência Atual: ${data.profitability}%
      - Custo Atual/ha: R$ ${data.currentCost} | Projetado: R$ ${data.projectedCost}
      - Histórico de Pragas: ${data.pests}
      - Histórico de Doenças: ${data.diseases}
      - Status de Manejo: ${data.managementStatus}

      REQUISITOS:
      1. Identifique a causa raiz da eficiência estar nesse nível (O PORQUÊ).
      2. Compare com padrões de mercado ou safras anteriores.
      3. Forneça 2 decisões rápidas baseadas em fatos.
      4. Responda em Português do Brasil de forma executiva e direta.`,
    });
    return response.text?.trim() || "Análise indisponível.";
  } catch (error) {
    console.error("Erro no Deep Analysis Gemini:", error);
    return "Falha ao correlacionar dados para decisão rápida.";
  }
};

export const generateStrategicInsights = async (data: any) => {
  try {
    const safeProposalsValue = data.totalProposalsValue || 0;
    const safeAvgInputCost = data.avgInputCost || 0;
    const safeTotalArea = data.totalArea || 0;
    const safeAvgProb = data.avgProb || 0;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Você é um Analista de BI Agrícola Sênior e Consultor Estratégico. Analise os seguintes dados agregados de uma carteira de produtores e forneça 3 insights críticos e acionáveis.
      
      DADOS AGREGADOS:
      - Total de Clientes: ${data.totalProducers || 0}
      - Valor em Propostas Abertas: R$ ${safeProposalsValue.toLocaleString('pt-BR')}
      - Área Total Monitorada: ${safeTotalArea} ha
      - Culturas Principais: ${(data.mainCrops || []).join(', ')}
      - Custo Médio Insumos/ha: R$ ${safeAvgInputCost.toLocaleString('pt-BR')}
      - Probabilidade Média de Fechamento: ${safeAvgProb.toFixed(1)}%
      - Alertas Sanitários Recentes: ${data.alertsCount || 0}

      REQUISITOS:
      1. Seja direto, executivo e proativo.
      2. Foque em rentabilidade e eficiência técnica.
      3. Aponte riscos ou oportunidades baseados nos números.
      4. Responda em formato de lista (bullet points).
      5. Responda em Português do Brasil.`,
    });
    return response.text?.trim() || "Insights temporariamente indisponíveis.";
  } catch (error) {
    console.error("Erro ao gerar insights BI:", error);
    return "Não foi possível processar a análise estratégica no momento.";
  }
};

export const generateDetailedReportAnalysis = async (reportTitle: string, reportData: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um Consultor Agronômico Sênior focado em eficiência produtiva. Analise os dados do relatório "${reportTitle}" abaixo e forneça uma conclusão técnica de 3 frases sobre como otimizar os resultados apresentados.
      
      DADOS DO RELATÓRIO:
      ${reportData}

      Responda em Português do Brasil. Seja técnico, direto e focado em resultados reais no campo.`,
    });
    return response.text?.trim() || "Análise detalhada pendente.";
  } catch (error) {
    console.error("Erro ao gerar análise detalhada:", error);
    return "O sistema não conseguiu processar a análise técnica deste relatório agora.";
  }
};

export const generateSalesProposal = async (data: {
  contactName: string;
  farmName: string;
  safra: string;
  activities: string[];
  totalValue: number;
  paymentMethod: string;
  items: string[];
  description: string;
}) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Você é um Consultor de Vendas Agrícolas (RTV) sênior e altamente persuasivo.
      Escreva uma mensagem de proposta comercial profissional e personalizada para ser enviada via WhatsApp ou E-mail.
      
      DADOS DO NEGÓCIO:
      - Destinatário: ${data.contactName}
      - Fazenda: ${data.farmName}
      - Safra: ${data.safra}
      - Atividades: ${data.activities.join(', ')}
      - Valor do Investimento: R$ ${data.totalValue.toLocaleString('pt-BR')}
      - Condição de Pagamento: ${data.paymentMethod}
      - Soluções Inclusas: ${data.items.join(', ')}
      - Contexto Técnico: ${data.description}

      REQUISITOS DA MENSAGEM:
      1. Comece saudando cordialmente.
      2. Destaque que a solução foi desenhada especificamente para os talhões mencionados e para a safra ${data.safra}.
      3. Enfatize o ganho de produtividade e segurança técnica.
      4. Apresente os valores e condições de forma clara e profissional.
      5. Termine com uma chamada para ação (CTA) para agendar uma reunião de fechamento ou tirar dúvidas.
      6. Use um tom de parceria e autoridade técnica.
      7. O texto deve ser formatado com quebras de linha amigáveis para leitura rápida.
      
      IMPORTANTE: Responda apenas com o corpo da mensagem em Português do Brasil.`,
    });

    return response.text?.trim() || "Não foi possível gerar a proposta no momento.";
  } catch (error) {
    console.error("Erro ao gerar proposta IA:", error);
    return "Erro ao processar a proposta via IA. Por favor, tente novamente ou escreva manualmente.";
  }
};

export const generateFollowUpMessage = async (history: ConversationNote[], contactName: string, farmName: string) => {
  if (history.length === 0) return `Olá ${contactName}, tudo bem? Gostaria de saber se você teve tempo de analisar nossa última proposta para a ${farmName}. Aguardo seu retorno!`;

  try {
    const historyText = history.map(h => `[${h.timestamp}]: ${h.content}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um Consultor Agrícola profissional. Escreva uma mensagem curta e cordial para WhatsApp cobrando um retorno do cliente ${contactName} sobre a negociação da fazenda ${farmName}.
      
      HISTÓRICO DE CONVERSAS:
      ${historyText}

      REQUISITOS:
      1. Use o histórico para mostrar que você está atento ao que foi conversado (cite pontos relevantes se houver).
      2. Seja empático mas focado em dar o próximo passo.
      3. A mensagem deve ser curta (máximo 3 parágrafos pequenos).
      4. Não invente dados técnicos que não estão no histórico.
      5. Responda apenas com o texto da mensagem em Português do Brasil.`,
    });

    return response.text?.trim() || "Não foi possível gerar a mensagem de follow-up.";
  } catch (error) {
    console.error("Erro ao gerar follow-up IA:", error);
    return `Olá ${contactName}, estou passando para retomar nossa última conversa sobre a ${farmName}. Como podemos prosseguir?`;
  }
};
