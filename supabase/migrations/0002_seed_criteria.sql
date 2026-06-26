-- ============================================================================
-- Migration 0002: seed the evaluation rubric (criteria)
-- Idempotent: re-running updates labels/descriptions but keeps ids.
-- ============================================================================

insert into criteria (key, label, description, weight, sort_order) values
  ('clareza_comunicacao', 'Clareza na comunicação',
   'Fala objetiva, sem ruído, fácil de entender; ritmo e linguagem adequados ao cliente.', 1.0, 1),
  ('dominio_processo', 'Domínio do processo comercial',
   'Conduz as etapas da venda com método; sabe onde está e para onde vai.', 1.2, 2),
  ('diagnostico', 'Diagnóstico do cliente',
   'Entende o contexto, cenário e necessidade real antes de oferecer solução.', 1.5, 3),
  ('perguntas', 'Capacidade de fazer perguntas',
   'Faz perguntas abertas e relevantes que aprofundam o entendimento.', 1.2, 4),
  ('identificacao_dores', 'Identificação de dores',
   'Encontra e qualifica as dores e o impacto/custo delas para o cliente.', 1.5, 5),
  ('conducao', 'Condução da conversa',
   'Mantém o controle e o direcionamento da call sem ser atropelado.', 1.3, 6),
  ('quebra_objecoes', 'Quebra de objeções',
   'Lida com objeções com segurança, validando e reposicionando valor.', 1.4, 7),
  ('apresentacao_solucao', 'Apresentação da solução',
   'Conecta a solução às dores levantadas, de forma personalizada.', 1.3, 8),
  ('criacao_valor', 'Criação de valor',
   'Constrói percepção de valor acima do preço; foca em resultado.', 1.3, 9),
  ('proximos_passos', 'Próximos passos',
   'Define claramente o que acontece a seguir, com data e compromisso.', 1.1, 10),
  ('fechamento', 'Fechamento / tentativa de avanço',
   'Pede o avanço/fechamento na hora certa; não deixa a call morrer.', 1.4, 11),
  ('postura', 'Postura profissional',
   'Confiança, escuta ativa, tom consultivo e presença.', 1.0, 12)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  weight = excluded.weight,
  sort_order = excluded.sort_order;
