import { RUBRIC } from '@/lib/criteria'
import { PRISMA_RCA_SKILL } from './skills/prisma-rca'
import { OBJECOES_SKILL } from './skills/objecoes'

const EVALUATOR_BASE = `Você é um head de vendas sênior, especialista em treinar Closers de alta performance.
Sua tarefa é analisar a transcrição de uma call comercial e avaliar o desempenho do Closer
de forma rigorosa, honesta e — acima de tudo — PRÁTICA.

Regras inegociáveis:
- Avalie SOMENTE o Closer (o vendedor), não o cliente.
- Dê uma nota de 0 a 10 para CADA critério da rubrica. Não pule nenhum.
- Notas devem ser criteriosas: 7 já é bom, 9-10 é excepcional e raro. Não infle.
- Toda justificativa e todo feedback deve se referir a algo concreto que aconteceu na call.
- O feedback final NÃO pode ser genérico. Em "better_approach", reescreva literalmente o que o
  Closer poderia ter dito em 1-2 momentos específicos (ex.: 'No lugar de X, ele poderia ter dito: "..."').
- Ações de melhoria devem ser específicas e acionáveis, não conselhos vagos.
- Responda SEMPRE em português do Brasil.
- Se a transcrição não identificar quem fala, estime o tempo de fala pela proporção do texto.
- Responda estritamente no formato JSON solicitado.`

// O system prompt combina o avaliador de rubrica com a skill comercial Prisma
// (análise de causa raiz para o setor de materiais de construção).
export const SYSTEM_PROMPT = `${EVALUATOR_BASE}\n\n${PRISMA_RCA_SKILL}\n\n${OBJECOES_SKILL}`

export function buildUserPrompt(input: {
  closerName: string
  clientName: string
  callDate: string
  transcript: string
}): string {
  const rubricLines = RUBRIC.map(
    (c) => `- ${c.key} (${c.label}, peso ${c.weight}): ${c.description}`,
  ).join('\n')

  return `# Contexto da call
- Closer: ${input.closerName}
- Cliente/Lead: ${input.clientName}
- Data: ${input.callDate}

# Rubrica de avaliação (use exatamente estes criterion_key)
${rubricLines}

# Transcrição da call
"""
${input.transcript}
"""

# Tarefa
Analise a call e produza:
1. Um resumo geral (summary).
2. A nota geral de 0 a 10 (overall_score), coerente com as notas por critério.
3. Estimativa do tempo de fala do Closer e do cliente (devem somar ~100).
4. Uma nota por critério com justificativa concreta (scores).
5. Momentos importantes da call (highlights): dores, objeções, viradas e riscos.
6. Feedback final estruturado e prático (feedback).
7. Ações de melhoria específicas e priorizadas (actions).
8. Um diagnóstico de CAUSA RAIZ comercial (root_cause), aplicando a skill Prisma:
   - diagnostico_direto: a causa principal mais provável, em poucas linhas.
   - sintoma: o que apareceu na superfície.
   - causa_aparente: o motivo óbvio que parece explicar.
   - causa_raiz: o fator profundo por trás (o que, se corrigido, evita repetição).
   - causas_secundarias: fatores que contribuíram.
   - categorias_causa: categorias envolvidas (ex.: qualificação, valor, urgência, autoridade,
     WhatsApp, reunião, follow-up, ICP, oferta, posicionamento, preço, processo, emocional…).
   - gravidade: baixo | medio | alto.
   - confianca: baixo | medio | alto (com base na quantidade de evidências).
   - etapa_quebrou: onde o processo quebrou (anuncio, lead, whatsapp, ligacao, qualificacao,
     reuniao, proposta, objecao, follow_up, decisao).
   - o_que_deveria_ter_acontecido: o comportamento comercial ideal.
   - como_corrigir_agora: ação prática de recuperação do caso.
   - como_prevenir: ajuste de processo/script/qualificação/campanha/gestão.
   - mensagem_recomendada: uma mensagem de WhatsApp, fala de ligação ou frase de reunião no
     tom firme e consultivo (vazia "" se não fizer sentido).
   - proximo_passo: uma ação objetiva para conduzir o avanço.
9. Um RELATÓRIO COMERCIAL DA OPORTUNIDADE (relatorio_comercial), analisando a call também
   pelo lado do CLIENTE e da CHANCE DE VENDA — não só do vendedor. Baseie-se SOMENTE na
   transcrição; se algo não estiver claro, use "não identificado na conversa". NÃO invente
   nome de empresa, produto, valor ou intenção.
   - contexto_do_cliente: quem é o cliente e o que buscava; produto/serviço/necessidade principal.
   - resumo_da_reuniao: resumo comercial curto (o que aconteceu, interesse do cliente, o que foi
     tratado e como terminou).
   - momento_de_compra: apenas_pesquisando | comparando_preco | pediu_orcamento |
     demonstrou_interesse_real | perto_do_fechamento | pronto_para_fechar | nao_identificado.
   - temperatura_do_lead: frio | morno | quente | muito_quente.
   - probabilidade_estimada_de_fechamento: número de 0 a 100, estimativa pelos sinais (não é certeza).
   - probabilidade_justificativa: motivo breve da porcentagem.
   - sinais_de_compra: lista (ex.: pediu preço, pediu orçamento, perguntou prazo, perguntou entrega,
     perguntou pagamento, pediu retorno mais tarde, perguntou como fechar, demonstrou urgência,
     comparou opções, pediu confirmação de disponibilidade).
   - objecoes_ou_travas: lista (ex.: preço, prazo, forma de pagamento, confiança, comparação com
     concorrente, falta de urgência, falta de informação, vendedor não conduziu, não identificado).
   - proximo_passo_ideal: a ação comercial mais correta após a call (ex.: enviar orçamento,
     confirmar forma de pagamento, tentar fechamento direto, mandar prova social, ligar novamente).
   - data_proximo_passo: se na transcrição ficou MARCADO um próximo passo/reunião com data ou
     horário (ex.: "terça às 15h", "amanhã 10h", "dia 15"), extraia exatamente o que foi combinado.
     Se NADA foi agendado na call, retorne exatamente "não identificado na conversa".
   - risco_de_perda: baixo | medio | alto.
   - risco_de_perda_motivo: por que esse risco (ex.: "Cliente demonstrou interesse, mas o vendedor
     não conduziu o fechamento").
   - diagnostico_comercial_final: diagnóstico direto de gestor comercial — o cliente estava perto de
     comprar? o vendedor aproveitou a oportunidade? principal erro/acerto comercial? o que fazer agora?
10. Um MAPA DE OBJEÇÕES (objecoes), aplicando a skill de Objeções. Para CADA objeção
    que apareceu na transcrição (não invente; cite/parafraseie a fala do lead):
    - fala_do_lead: o que o lead disse.
    - tipo: prospeccao | red_herring | microcompromisso | compra.
    - resposta_do_vendedor: como o vendedor reagiu (resuma).
    - qualidade: boa | mediana | ruim.
    - problema: o que houve de errado na resposta (ou "—" se foi boa).
    - resposta_ideal: a resposta melhor, no tom do vendedor (validar → esclarecer →
      reposicionar pela dor → pedir o próximo passo).
    Se não houver objeções na call, retorne uma lista vazia.`
}
