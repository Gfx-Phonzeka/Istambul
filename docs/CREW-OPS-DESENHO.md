# Crew Ops · Desenho para aprovação

Proposta de uma área nova do HB Portal para gerir a equipa de produção: pessoas, equipas, dias de trabalho, viagens, alojamento e custos. Serve para Istambul 2027 e para Lima 2027 e substitui as folhas de Excel de "crew control". **Estado:** Fase A e Fase B publicadas nos dois portais (27 nov 2026). Fases C (viagens, alojamento, transfers) e D (tarifas e custos) por fazer.

## 1. A ideia principal

Hoje a mesma pessoa é escrita à mão em várias folhas (custos, rooming list, transfers, acreditações) e o plano operacional não alimenta os dias de cada pessoa.

No Crew Ops, **o plano operacional é a fonte** e o resto é gerado a partir dele. Há três peças, independentes entre si:

| Peça | O que é | Exemplo |
|---|---|---|
| **Unidade de produção** (PU / LPU) | OB van ou flypack, com o seu plano diário e os desportos/sedes que cobre por períodos. Uma unidade pode cobrir vários desportos. | PU 2: atletismo de 9 a 15, depois rugby de 18 a 21 |
| **Equipa técnica** | Fica ligada à sua unidade (engenheiros, CCU, áudio, assistentes). | Técnica da PU 2 |
| **Equipa operacional / artística** | Realizador, câmaras, EVS (e por vezes o produtor). É independente e pode "saltar" de unidade em unidade, muitas vezes por estar unida por nacionalidade ou empresa. | Equipa "Lisboa A": PU 2 de 9 a 15, depois PU 5 de 17 a 21 |

1. Cada equipa (técnica ou operacional) é **atribuída a unidades por períodos de datas**.
2. Cada pessoa pertence a uma ou mais equipas, e por isso pode passar por **várias unidades** ao longo dos Jogos. O produtor pode ir com a equipa operacional ou ficar com a técnica, conforme a gestão decidir.
3. Os dias de trabalho de cada pessoa saem das atribuições das suas equipas e dos seus voos. A coordenação só acerta as exceções.
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

1. **Ficha pessoal**, preenchida pela própria pessoa. Para já com os dados gerais abaixo. Quando chegar a **matriz de dados do Comité Organizador**, os campos que faltarem são acrescentados sem refazer a ficha. A exportação para a acreditação sai no formato exato dessa matriz.
   - nome, nacionalidade, documento (número e validade, **sem cópia do documento**), data de nascimento, género;
   - email, telefone, contacto de emergência;
   - tamanhos de polo e hoodie;
   - foto para acreditação;
   - línguas.
2. **Participação no evento**, definida pela coordenação:
   - função (da lista de funções, ver secção 7) e, quando faz falta, a posição concreta (por exemplo "Câmara 3 – SSM esquerda, tatami 2");
   - equipas a que pertence (técnica de uma unidade, operacional/artística, IBC/MCR, BVM, Management), com as datas de cada atribuição;
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
| B | Unidades de produção, equipas técnicas e operacionais, atribuições por datas, dias gerados por pessoa, folha de serviço diária | Substitui a grelha de dias do crew control |
| C | Viagens, alojamento, transfers | Rooming list e lista de chegadas/partidas automáticas |
| D | Tarifas, custos, resumo geral | Substitui o cálculo de custos e o "General Cost" |

## 5. Custos de infraestrutura

O plano gratuito do Supabase chega para a fase de teste com cerca de 500 pessoas: as fotos de acreditação ocupam cerca de 100 MB. Antes de usar dados reais de toda a equipa, recomenda-se o plano pago, por causa das cópias de segurança automáticas (decisão do responsável).

## 6. Decisões

**Respondidas pelo responsável (27 nov 2026):**
1. **Dias pagos (forfait):** os dias de voo e as folgas contam como dias. Exceção: os dias livres entre o Pan e o Parapan (10 a 15 dias); se, por acordo com o freelancer, ele não regressar a casa, nesses dias só recebe per diem.
2. **Tarifa mensal:** divide-se sempre por 30.
3. **Omnicam4Sky, CLS, Overon e semelhantes:** pagam-se às empresas como serviço fechado (não entram no cálculo por dias).
4. **Códigos da grelha:** MD = Match Day (dia de competição); CHECK = dia de check ou de teste.
5. **Per diem dos freelancers:**
   - Internacional (fora da Península Ibérica): 32,5 € por almoço ou jantar; 7,5 € pequeno-almoço; 7,5 € extra (mais de 16 horas).
   - Espanha: 20 € por almoço ou jantar; 7,5 € pequeno-almoço; 7,5 € extra.
   - Funcionários: regras diferentes, [A CONFIRMAR] (o responsável envia depois).
6. **Acesso à gestão (Crew Ops):** direção, produtor selecionado (acumula funções de gestão) e administrador do site (também acumula); mais 1 ou 2 pessoas que **só** acedem a esta parte do portal (controlling e finanças da empresa).
7. **IBAN:** os IBAN dos freelancers **não** entram no portal (ficam no sistema financeiro).
8. **"MEDIA GEST" na grelha:** indica que os dados já estão na base de faturação. O Mediagest é a base de dados da empresa (ligada ao SAP) para pagamentos e faturação. O portal não substitui o Mediagest: na fase B, marca quem já foi lançado lá.
9. **Nomes das funções:** inglês e português (Lima em português do Brasil, Istambul em português de Portugal).

**Tabela de cachets (recebida a 27 nov 2026, confidencial: os valores ficam fora do repositório).** Estrutura a usar na fase B:
- Nível júnior / sénior; tabela de referência do cliente; tipo de faturação (recibos verdes/unipessoal ou cooperativa/sociedade por quotas).
- Cachet por dia, ou forfait de 30 dias por função.
- Produções internacionais: dias de viagem com valor próprio (refeições incluídas); dias de montagem pagos como assistente sénior; dias off a metade do cachet mais refeições.
- Sem cachet no dia de viagem quando a partida é a partir das 21h ou a chegada até às 9h.
- Responsável de material, chefe técnico e produtor recebem a montagem como dia de operação.
- Chefe técnico que acumula com uplinker tem um acréscimo fixo no cachet base.
- Assistente de câmara pela tabela sénior (júnior só em casos excecionais indicados pela coordenação).
- Refeições por local (Portugal, Espanha, resto do mundo): pequeno-almoço (saída até às 7h), almoço, jantar, extra.
- **Decidido:** em forfait (como nos Jogos), os dias off contam como dias normais. A regra de dias off a metade do cachet mais refeições aplica-se só a produções internacionais de curta duração, pagas ao dia.

**Ainda em aberto:** regras de per diem dos funcionários; validação da lista de funções (abaixo).

## 7. Lista de funções (rascunho para validar)

Rascunho feito a partir das funções do crew control de Istambul. Os números ("Câmara 3", "EVS 2") e as especificações ("SSM esquerda", "tatami 2") deixam de ser funções diferentes: passam a ser a **posição** dentro da função.

| Área | Funções |
|---|---|
| Direção e gestão | Project Leader · Project Manager · Head of Production / Content · Production (coordenação) · Logistics Manager · BMS General Manager · BMS Commercial Manager |
| Engenharia (gestão) | IBC Engineering Manager · Deputy Engineering Manager · Venues Tech Manager · RF & LiveU Coordinator |
| Sedes | Broadcast Venue Manager (BVM) |
| Produção na unidade | Producer · TV Director · TV Director Assistant · Floor Manager |
| Câmaras | Camera Operator · PTZ Camera Operator · Camera Assistant · Special Cameras Technician |
| Repetições | EVS Operator |
| Técnica da unidade | OB Van Video Engineer · OB Van Audio Engineer · OB Van Material Video Supervisor · OB Van Material Audio Supervisor / Tech Assistant · CCU Operator · Audio Assistant · RF Technician · Setup Engineer / Technician |
| Comentários | Commentary Mixer Tech (VoIP) |
| IBC / MCR | CDT Coordinator · CDT Operator · Contribution Network Manager · Contribution Network Operator · EVS Engineer · Ingest Coordinator · Ingest Operator · Media Manager Supervisor · Logger · Editor Supervisor · Editor · Making Of Operator · Audio Tech Coordinator · Electricity Technician · Installer |
| Qualidade | PQC (Production Quality Control) · Tech PQC |
| Logística de produção | Producer / Logistic Producer |

Falta validar: nomes finais (inglês, ou também espanhol e português?), funções que faltam em Lima (por exemplo produção de conteúdo, ENG da zona mista, gráficos) e as que se juntam ou separam.
