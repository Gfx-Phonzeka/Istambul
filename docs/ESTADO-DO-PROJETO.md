# HB Portal · Estado do projeto

Atualizado a 24 de novembro de 2026. Este ficheiro guarda as regras, decisões e pendentes do projeto para não dependerem da memória da conversa. Repositório público: **nunca** escrever aqui palavras-passe, chaves ou dados pessoais.

## 1. Regras de trabalho (dadas pelo responsável do projeto)

- Responder sempre em **português**; o responsável não programa: explicar passo a passo e em linguagem simples.
- **Nunca** escrever palavras-passe no chat. **Nunca** pôr dados pessoais ou confidenciais no repositório (é público).
- Não inventar factos oficiais: dados de exemplo marcados **[EJEMPLO] / [EXEMPLO]**; dados desconhecidos **[POR CONFIRMAR] / [A CONFIRMAR] / [TBC]**.
- Publicar diretamente em produção quando o trabalho estiver testado ("avança já no oficial").
- **hblima2027.info: não tocar.**
- **Supabase: não avançar com nada que custe dinheiro** sem autorização explícita (a passagem ao plano Pro é feita pelo responsável).
- Lima: o português é **do Brasil**. A tradução é feita fora do site (não há tradutor automático em Lima).
- Línguas dos grafismos em Lima: espanhol.
- Não mexer no roadmap (`docs/ROADMAP.md`) sem pedido.

## 2. Os dois portais

| | Istanbul 2027 | Lima 2027 |
|---|---|---|
| Evento | 4.º Jogos Europeus | Jogos Pan-Americanos e Parapan-Americanos |
| Host Broadcaster | Medialuso | Imagina |
| Endereço | hbistambul2027.info (e istanbul2027-rhb-portal.vercel.app) | lima2027-hb-portal.vercel.app |
| Línguas do portal | EN, TR | ES, EN, PT-BR |
| Línguas das Production Guidelines | EN, PT, TR | ES, PT-BR |
| Hora | TRT (UTC+3) | PET (UTC−5) |
| Supabase (projeto) | tnrpoymjmktbpygiqccm (eu-central-1) | qhsyvhnzvblazfkuwnim (sa-east-1) |
| Vercel (projeto) | istanbul2027-rhb-portal (região fra1) | lima2027-hb-portal (região gru1) |
| Pedidos de serviço dos RHB | tratados pela EBU (sem secção) | secção **Booking** → site de reservas (huin.tv) |
| Canal Integrado | não | sim |

Um só código (Next.js) para os dois; o evento escolhe-se com `NEXT_PUBLIC_EVENT` e as diferenças vivem em `src/lib/event.ts`. Ramo de trabalho: `claude/new-session-f0n2oe`.

## 3. Como se publica

- Commit e push para `claude/new-session-f0n2oe`; deploy de produção no Vercel (equipa `team_Y8IcKNVHIHC8Yzo3awnCapQd`) para os dois projetos, a partir desse commit.
- Alterações à base de dados: ficheiros em `supabase/migrations` (comuns) e `supabase/lima` (só Lima); aplicadas às duas bases quando são comuns.
- Contas de demonstração e palavras-passe: `supabase/seed/*.local.sql`, **fora do git**.
- Scripts de Lima em `scripts/lima`: importar planos de câmaras (`parse_plans.mjs` + `import_plans.mjs`), fotos de venues, calendário, glossário, conteúdos, guidelines.

## 4. O que está feito (resumo)

Comum aos dois portais: registo com aprovação, perfis e visibilidade por audiência (todos / RHB / parceiros / produção / interno), notícias, briefings (com destaque para a equipa e vídeos só de produção), Media Hub (incluindo documentos por audiência), handbook com PDF, venues, mapas de câmaras, calendário, sinal e distribuição, FAQ, glossário, contactos, páginas legais, pesquisa, notificações, área da equipa (Production Guidelines com storyboard das cerimónias de medalhas, relatórios diários, pedidos da equipa), backoffice completo (utilizadores, conteúdos, importações, editor de câmaras, estatísticas, registos). Navegação corrigida (deixou de haver cliques que demoravam 15 s).

Lima em particular:
- 84 planos de câmaras importados.
- Calendário Pan refeito como o oficial (20 jul – 8 ago, sem chegadas/partidas, coluna "Ubicación" do calendário oficial); venues alinhadas com o calendário oficial (Canchas de Squash e Circuito de Pentatlón em VMT, Circuito de Ciclismo de Montaña em Pachacamac).
- Cerimónias às 20:00; abertura e encerramento no Estadio Nacional.
- Canal Integrado (grelha diária, Excel, PDF, linha do tempo), Booking em zona própria do menu.
- Fotos de 7 venues tiradas do site oficial lima2027.org.pe.

Documentos de apoio: `docs/ROADMAP.md` (desenvolvimentos futuros), `docs/skill-hb-portal-design` + `docs/hb-portal-design-skill.zip` (skill de design só visual para o site de booking), documento em castelhano com todas as funções (Claude Docs: "HB Portal · Lima 2027 e Istanbul 2027 · Funcionalidades").

## 5. Pendentes

**Lima — conteúdos**
- Planos de câmaras em falta: ginástica artística (Pan); para tiro desportivo e para ciclismo de estrada (Parapan).
- Calendário Parapan: falta o calendário oficial em imagem para refazer como o Pan (hoje a coluna "Ubicación" mostra o cluster).
- Fotos das venues da VIDENA e de Villa María del Triunfo: decidir se se usa a foto aérea do complexo em todas as venues ou se ficam sem foto.
- Dados por confirmar: textos legais, emails de contacto, datas de testes, IDs de satélite e de stream, rate card.
- Emails automáticos de Lima ainda em inglês; legendas dos briefings só em EN/TR.

**Decisões do responsável**
- Passar o Supabase ao plano Pro (necessário para ficheiros > 50 MB e para dados da equipa).
- Mudar a palavra-passe da conta demo de administrador de Istambul (apareceu num registo interno de comandos).

**Ideia em estudo: módulo de operações da equipa ("HB Ops"), para Istambul e Lima** — não implementar sem pedido.
- Base: o plano operacional (PU/LPU, modo OB/REMI/REMOTE, plano diário) gera os dias de cada pessoa, a partir dos ficheiros "Crew Control" e "Tentative Operational Plan" de Istambul.
- Três tipos de colaborador: freelancer (cachet por dias), funcionário (só per diem), funcionário de empresa do grupo (paga-se à empresa).
- Viagens, alojamento (rooming list), transfers, folhas de serviço, checklists de venue, registo de incidentes, resumo de custos automático, import/export Excel. Auto-preenchimento pelas pessoas. Sem cópias de passaportes.
- Fora do âmbito (decidido): inventário de equipamento, log de momentos/medalhas, pedidos de clips, alertas meteorológicos.
- Perguntas em aberto: dias de voo e OFF são pagos? A tarifa mensal divide-se por 30 ou pelos dias do mês? Omnicam4Sky, CLS e Overon são empresas do grupo ou fornecedores? O que é "MEDIA GEST" e os códigos MD e CHECK? Os acertos "+6 −32,5" e "−15" no per diem são individuais?
