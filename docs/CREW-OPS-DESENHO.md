# Crew Ops · Desenho para aprovação

Proposta de uma área nova do HB Portal para gerir a equipa de produção: pessoas, equipas, dias de trabalho, viagens, alojamento e custos. Serve para Istambul 2027 e para Lima 2027 e substitui as folhas de Excel de "crew control". **Ainda não está construído:** este documento é para decidir antes.

## 1. A ideia principal

Hoje a mesma pessoa é escrita à mão em várias folhas (custos, rooming list, transfers, acreditações) e o plano operacional não alimenta os dias de cada pessoa.

No Crew Ops, **o plano operacional é a fonte** e o resto é gerado a partir dele:

1. Cada unidade de produção (PU / LPU) tem o seu plano diário: chegada, montagem, ensaio, directo, regresso.
2. Cada pessoa pertence a uma equipa de uma unidade (por exemplo, PU 2 – Técnica).
3. Os dias de trabalho de cada pessoa saem do plano da sua unidade e dos seus voos. A coordenação só acerta as exceções.
4. Os custos, a rooming list, os transfers e as listas saem daí, sem escrever duas vezes.

## 2. Quem vê o quê

| Quem | O que vê e faz |
|---|---|
| Cada pessoa da equipa | Preenche e corrige a sua ficha; vê os seus dias, voos, hotel e a sua folha de serviço diária. |
| BVM, Produtor, Realizador | Vê a lista e os dias da sua equipa (sem dados pessoais sensíveis nem valores). |
| Coordenação de produção e logística | Vê e edita tudo menos valores (equipas, planos, viagens, alojamento). |
| Finanças / direção | Vê também tarifas, custos e o resumo geral. |

Os dados pessoais (documento, data de nascimento, contactos de emergência) só são vistos pela própria pessoa e pela coordenação. Fica registado quem consultou ou alterou cada ficha.

## 3. As partes

1. **Ficha pessoal**, preenchida pela própria pessoa:
   - nome, nacionalidade, documento (número e validade, **sem cópia do documento**), data de nascimento, género;
   - email, telefone, contacto de emergência;
   - tamanhos de polo e hoodie;
   - foto para acreditação;
   - línguas.
2. **Participação no evento**, definida pela coordenação:
   - função (da lista de funções: Realizador, Operador de câmara 1, EVS 1…);
   - equipa (PU n – Produção / Técnica, IBC/MCR, BVM, Management);
   - sede e desporto;
   - tipo de colaborador e entidade (Medialuso, freelancer, empresa do grupo).
3. **Unidades de produção e plano operacional:**
   - cada PU/LPU com tipo (XL, L, M), câmaras e modo (OB, REMI, REMOTE);
   - desportos e sedes atribuídos;
   - plano diário. Os dias de directo e de medalhas podem vir do calendário de competição que o portal já tem.
4. **Dias de cada pessoa:** gerados a partir da sua unidade e dos seus voos (dia de voo, montagem, ensaio, directo, folga, desmontagem, voo de regresso), com exceções à mão. Se a unidade mudar de datas, as pessoas mudam com ela.
5. **Viagens:** voos de ida e volta (companhia, número, horários, localizador) e extras (comboio, bagagem, carro).
6. **Alojamento:** hotel, tipo de quarto, partilha de quarto, entrada e saída → **rooming list** para o hotel.
7. **Transfers:** gerados a partir dos voos → **lista de chegadas e partidas** para o transporte.
8. **Custos:**
   - tabela de tarifas por função e tipo de colaborador, em vez de números escritos dentro das fórmulas;
   - cálculo automático por pessoa;
   - resumo geral do evento (equipas, viagens, hotéis, transfers…) como a folha "General Cost";
   - a faturação e a margem continuam a ser escritas por vocês.

   | Tipo de colaborador | Cálculo | A quem se paga |
   |---|---|---|
   | Freelancer | tarifa da função × dias (regra a confirmar) | à pessoa |
   | Funcionário | só per diem por dia deslocado | à pessoa, por via interna |
   | Funcionário de empresa do grupo | tarifa acordada × dias | à empresa, em fatura agrupada |

9. **Exportações para Excel:**
   - crew control no formato atual;
   - rooming list;
   - transfers;
   - lista para acreditação do Comité Organizador;
   - uniformes;
   - pagamentos por pessoa e por entidade.
10. **Importação inicial:** carregar o crew control de Istambul que já existe, para não começar do zero.

**O portal calcula e exporta, mas não paga.** Os pagamentos continuam a ser feitos pelo sistema financeiro da empresa.

**Fica de fora (decidido):** inventário de equipamento, log de momentos e medalhas, pedidos de clips, alertas meteorológicos.

## 4. Construção por fases

Cada fase fica utilizável e é publicada nos dois portais antes de passar à seguinte.

| Fase | O que entra | Para que serve logo |
|---|---|---|
| A | Ficha pessoal, participação, equipas, níveis de acesso, importação e exportação Excel | Base da equipa e listas (contactos, uniformes, acreditação) |
| B | Unidades de produção, plano operacional, dias gerados por pessoa, folha de serviço diária | Substitui a grelha de dias do crew control |
| C | Viagens, alojamento, transfers | Rooming list e lista de chegadas/partidas automáticas |
| D | Tarifas, custos, resumo geral | Substitui o cálculo de custos e o "General Cost" |

## 5. Custos de infraestrutura

O plano gratuito do Supabase chega para a fase de teste com cerca de 500 pessoas: as fotos de acreditação ocupam cerca de 100 MB. Antes de usar dados reais de toda a equipa, recomenda-se o plano pago, por causa das cópias de segurança automáticas (decisão do responsável).

## 6. Decisões em aberto

1. Os dias de voo e as folgas (OFF) contam para o pagamento dos freelancers? (Na folha atual contam todos os dias preenchidos.)
2. A tarifa mensal divide-se sempre por 30, ou pelos dias do mês?
3. Omnicam4Sky, CLS e Overon são empresas do grupo (paga-se à empresa) ou fornecedores externos (um quarto tipo)?
4. O que significam "MEDIA GEST" e os códigos MD e CHECK na grelha de dias?
5. O per diem dos funcionários é sempre igual (115 €/dia), ou há acertos individuais como na folha atual ("+6 −32,5", "−15")?
6. O IBAN dos freelancers entra no portal, ou fica só no sistema financeiro? (Recomendação: fica fora do portal.)
7. Quem são, por nome de função, as pessoas com acesso de coordenação e de finanças?
