# Zeladoria

Plataforma municipal para registro, acompanhamento e gestão de ocorrências urbanas.

## Stack

- Vite + React 18
- React Router
- TanStack Query
- Tailwind CSS + componentes shadcn/Radix
- Leaflet/react-leaflet para mapas
- Base44 SDK para autenticação, entidades, uploads e persistência

## Como rodar

1. Instale dependências:

```bash
npm install
```

2. Configure `.env.local` com as credenciais Base44.

   Use `.env.example` como referência para as credenciais e para a configuração municipal do mapa.

3. Rode localmente:

```bash
npm run dev
```

## Etapa 1 implementada

### Acompanhamento do cidadão

- Página `/minhas-ocorrencias` agrupada por:
  - Abertas
  - Em andamento
  - Concluídas
  - Canceladas
- Página `/ocorrencia/:id` com:
  - Número de protocolo
  - Categoria e subcategoria
  - Endereço e mapa
  - Fotos e vídeos
  - Descrição
  - Secretaria/equipe pública quando disponível
  - Prazo estimado
  - Linha do tempo
  - Comentários e anexos
  - Histórico de alterações
  - Confirmação de resolução, reabertura e avaliação
- Apoio a ocorrências via entidade própria.
- Comentários/anexos persistidos no Base44.
- Notificações para mudanças administrativas e equipe de campo.
- Auditoria para ações relevantes.

### Status de ocorrência

Fluxo novo:

`registrada`, `recebida`, `em_triagem`, `encaminhada`, `aguardando_vistoria`, `programada`, `em_execucao`, `aguardando_material`, `concluida`, `nao_procedente`, `duplicada`, `cancelada`, `reaberta`.

Status legados (`aberto`, `em_analise`, `equipe_enviada`, `resolvido`) continuam reconhecidos para compatibilidade com dados antigos, mas novas criações usam `registrada`.

### Entidades Base44

- `Occurrence`: ocorrência principal, agora com protocolo, prazo, mídia, timeline, histórico, avaliação, reabertura e campos públicos de secretaria/equipe.
- `OccurrenceSupport`: apoio do cidadão sem editar diretamente a ocorrência.
- `OccurrenceComment`: comentários, informações adicionais e anexos.
- `AuditLog`: registros de auditoria com leitura restrita a perfis municipais.
- `Notification`: notificações ao cidadão.

## Refinamento profissional aplicado

- Configuração municipal centralizada em `src/lib/municipality.js`.
- Mapas, clima, SOS e criação de ocorrência deixam de usar coordenadas fixas espalhadas.
- Fallback padrão configurado para Queimados/RJ e sobrescritível por `VITE_MUNICIPALITY_*`.
- Validação de latitude/longitude antes de salvar ocorrência; bloqueio territorial pode ser ativado com `VITE_MUNICIPALITY_ENFORCE_BOUNDS=true`.
- Home e Transparência usam modo de privacidade no mapa/lista para não expor endereço exato de categorias sensíveis.
- Bottom navigation aparece apenas em telas pequenas, com até cinco itens e menu “Mais”.
- Botões flutuantes de SOS e assistente foram reposicionados para não cobrir a navegação mobile.
- `/app-equipe` saiu do layout cidadão e exige perfil operacional.
- RLS de entidades operacionais foi alinhada aos perfis `admin`, `gestor`, `atendente`, `fiscal`, `equipe_campo` e `equipe` conforme responsabilidade.
- Gradientes explícitos foram removidos de logo e gráficos.

## Validação

Comandos executados:

```bash
npm run lint
npm run build
```

`npm run typecheck` ainda falha por problemas preexistentes da configuração `checkJs` com componentes UI e dependências como Leaflet; o build de produção passa.
