# Guia · Trabalhar no HB Portal com o Claude e o Antigravity

Este guia é para ti. Explica como preparar o Google Antigravity uma vez e como passar o trabalho de um para o outro sem estragar os portais. Não precisas de saber programar: copias e colas os textos indicados.

## A regra de ouro

**Só um trabalha de cada vez.** Quando um está a trabalhar, o outro está parado. A passagem de turno faz-se sempre com os textos da secção 3.

## 1. Preparar o Antigravity (só uma vez)

1. **Instala o Antigravity** no teu computador e entra com a tua conta Google.
2. **Abre o projeto a partir do GitHub.** No Antigravity, pede ao agente:
   > Clona o repositório do GitHub Gfx-Phonzeka/Istambul, ramo claude/new-session-f0n2oe, numa pasta chamada HB-Portal, e instala o que for preciso para o projeto funcionar (Node.js e dependências). Explica-me em português simples o que estás a fazer.
   Se ele pedir para entrares no GitHub, entra com a tua conta.
3. **Os ficheiros privados.** Há ficheiros com chaves e palavras-passe que não estão no GitHub, de propósito:
   - `.env.local` e `.env.lima.local` (ligação aos dois portais);
   - `supabase/seed/demo-accounts.local.sql` e `supabase/seed/lima-demo-accounts.local.sql` (contas de demonstração).
   Pede-os ao Claude: ele envia-os só a ti. Coloca-os nos mesmos sítios dentro da pasta HB-Portal. **Nunca os envies por email, chat ou GitHub.**
4. **Acesso às bases de dados e aos sites.** Pede ao agente do Antigravity:
   > Liga-te ao Supabase através do servidor MCP oficial do Supabase e à Vercel através da linha de comandos da Vercel. Diz-me passo a passo o que tenho de fazer para te dar acesso com a minha conta, sem me pedires para escrever palavras-passe no chat.
   Ele vai pedir-te para criares um "token" pessoal no Supabase e para entrares na Vercel. Segue os passos dele.
5. **Confirma que ele leu as regras.** Diz-lhe:
   > Lê o AGENTS.md e o docs/ESTADO-DO-PROJETO.md e resume-me, em 5 linhas e sem termos técnicos, as regras do projeto e o que está pendente.
   Se a resposta vier com termos técnicos ou não for em português, diz-lhe: "Segue a secção 1 do AGENTS.md: responde-me sem termos técnicos."

## 2. Cópias de segurança

No fim de cada turno, o agente faz uma cópia das duas bases de dados para a pasta `HB-backups` do teu computador (fora do projeto). De vez em quando, copia essa pasta para o teu Google Drive, numa pasta privada. **Não partilhes estas cópias:** têm dados pessoais dos utilizadores.

## 3. Textos prontos para a passagem de turno

**Para começar um turno (no Claude ou no Antigravity):**
> Começa o teu turno no HB Portal: descarrega a versão mais recente, lê o AGENTS.md e o último registo de turnos do docs/ESTADO-DO-PROJETO.md, e diz-me em 3 linhas o que o outro agente deixou feito e o que está pendente.

**Para acabar um turno:**
> Acaba o teu turno no HB Portal seguindo a secção 3 do AGENTS.md: cópia de segurança das duas bases, tudo enviado para o GitHub, registo de turno escrito. Depois diz-me em português simples o que ficou feito e o que ficou pendente.

**Se a quota acabar a meio de um trabalho:** no outro agente, começa o turno com o primeiro texto e acrescenta:
> O turno anterior acabou a meio porque a quota terminou. Antes de fazeres qualquer coisa, verifica o que ficou por enviar ou a meio e diz-me o que encontraste.

## 4. Se alguma coisa correr mal

- **O site ficou estranho depois de uma publicação:** diz ao agente "repõe no Vercel a versão anterior dos dois portais e depois descobre o que correu mal". Repor demora poucos minutos.
- **Desapareceram conteúdos:** diz ao agente "não mexas em mais nada; usa a última cópia de segurança para ver o que mudou e diz-me o que se pode recuperar".
- **Dúvidas sobre o que está feito:** pede "resume-me o estado do projeto a partir do docs/ESTADO-DO-PROJETO.md".
