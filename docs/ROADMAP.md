# HB Portal · Desenvolvimentos futuros

Lista de desenvolvimentos pedidos e ainda não implementados (Istambul 2027 e Lima 2027).

## 1. Inscrição obrigatória da equipa de produção e acreditações (Lima, ~500 utilizadores)

**Objetivo:** cada membro da equipa de produção inscreve-se no portal (obrigatório). Os dados introduzidos alimentam a acreditação e a gestão de produção, sem folhas de cálculo paralelas.

- **Formulário de inscrição** com os dados pessoais e profissionais, tamanhos de roupa e foto.
- **Foto para acreditação:** upload com verificação de formato e dimensões (fundo, enquadramento) e armazenamento privado.
- **Matriz de acreditação para o LOC:** exportação no formato pedido pelo LOC (formato ainda por receber).
- **Listas geradas a partir das inscrições:**
  - Lista de contactos.
  - Lista de equipamento de uniforme (peças e tamanhos por pessoa e totais por tamanho).
  - Listas de pessoal por equipa (sede, desporto, função), para a gestão de produção.
  - Outras listas a definir.
- Exportações Excel/PDF para coordenação e administração.

## 2. Níveis de acesso dentro da equipa de produção

| Nível | Funções | Acesso |
|---|---|---|
| Básico | Operadores e assistentes | Só informativo: briefings, Handbook, Diretrizes de Produção, calendários, notícias da Área da equipa. **Sem** Media Hub, Booking, relatórios ou qualquer função de edição ou criação. |
| Responsável | BVM, Produtor, Realizador | Tudo o que é da equipa: relatórios diários, pedidos da equipa, Booking, Media Hub e as funções de edição/criação reservadas à equipa. |

Implica um subnível no papel `production` (por exemplo `production_basic` / `production_lead`), com regras de acesso (RLS) e menus por nível.

## 3. Outros pendentes

- Emails automáticos de Lima em espanhol/português (hoje em inglês).
- Legendas dos briefings em ES/PT (hoje só EN/TR).
- Domínios próprios e envio de emails pelo domínio do evento.
- Acesso único (SSO) com o site de booking de Lima, se a equipa técnica o confirmar.
- Istambul: pack PDF por sede.
