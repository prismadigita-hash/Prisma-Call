-- ============================================================================
-- Seed de demonstração (opcional). Rode DEPOIS das migrations 0001 e 0002.
-- Cria 2 Closers e 1 call de exemplo (pendente) para você testar o fluxo de IA.
-- ============================================================================

insert into closers (name, email, role) values
  ('Ana Closer', 'ana@empresa.com', 'Closer Sênior'),
  ('Bruno Vendas', 'bruno@empresa.com', 'Closer')
on conflict do nothing;

-- Call de exemplo vinculada à Ana, com uma transcrição curta para análise.
insert into calls (closer_id, client_name, call_date, source, status, transcript)
select
  c.id,
  'Empresa XPTO — Maria (Head de Marketing)',
  current_date - 3,
  'transcricao',
  'pendente',
  $transcript$
Closer: Oi Maria, tudo bem? Obrigado pelo tempo. Me conta um pouco do cenário de vocês hoje.
Cliente: Oi! Então, a gente tá com dificuldade de gerar leads qualificados. Investimos em ads mas não converte.
Closer: Entendi. E hoje quanto vocês investem por mês mais ou menos?
Cliente: Uns 20 mil em mídia, fora a equipe.
Closer: E desse investimento, vocês conseguem medir quantos viram cliente?
Cliente: Aí que tá, a gente não tem essa visibilidade direito.
Closer: Deixa eu te mostrar como a nossa solução resolve isso. A gente tem um dashboard que centraliza tudo...
Cliente: Legal, mas a gente já tentou ferramenta parecida e não funcionou.
Closer: Mas a nossa é diferente, tem IA. Enfim, o investimento é 2 mil por mês. Fechamos?
Cliente: Vou pensar e te retorno.
Closer: Beleza, qualquer coisa me chama.
  $transcript$
from closers c
where c.email = 'ana@empresa.com'
limit 1;
