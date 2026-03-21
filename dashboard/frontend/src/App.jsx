import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  executeCommand,
  getCommandCatalog,
  getCurrentSession,
  getDraftContextTargets,
  getGroupMembers,
  getGuildChannels,
  getGuildMembers,
  getGuilds,
  getPollContextTargets,
  logoutSession,
  uploadCsv,
} from './api';

const CSV_COLUMNS = [
  {
    order: 1,
    name: 'nome-da-enquete',
    type: 'texto',
    description: 'Título da enquete',
    example: '(1º turno) Votação para o livro do mês de Março de 2026',
  },
  {
    order: 2,
    name: 'opcoes',
    type: 'texto',
    description: 'Opções separadas por vírgula, barra (/) ou pipe (|)',
    example:
      'Orlando - Virginia Woolf (288 p.),Mrs. Dalloway - Virginia Woolf (240 p.),Britt-Marie esteve aqui - Fredrik Backman (304 p.)',
  },
  {
    order: 3,
    name: 'max_votos',
    type: 'inteiro',
    description: 'Número máximo de votos por participante',
    example: '2',
  },
  {
    order: 4,
    name: 'peso_mensalistas',
    type: 'sim  /  nao',
    description: 'Aplica peso especial para mensalistas',
    example: 'sim',
  },
];

const CsvFormatGuide = memo(function CsvFormatGuide() {
  return (
    <section className="csv-guide">
      <h2>Formato do CSV</h2>
      <p className="csv-info-text">
        O arquivo deve usar <strong>ponto e vírgula (;)</strong> como separador e conter{' '}
        <strong>exatamente 4 colunas</strong> nesta ordem:
      </p>

      <div className="csv-table-wrapper">
        <table className="csv-format-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome da coluna</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Exemplo</th>
            </tr>
          </thead>
          <tbody>
            {CSV_COLUMNS.map((col) => (
              <tr key={col.order}>
                <td className="col-order">{col.order}</td>
                <td>
                  <code className="col-name">{col.name}</code>
                </td>
                <td className="col-type">{col.type}</td>
                <td>{col.description}</td>
                <td>
                  <code>{col.example}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="csv-info-text">Prévia do arquivo:</p>
      <pre className="csv-preview-block">
        {`nome-da-enquete;opcoes;max_votos;peso_mensalistas
(1º turno) Votação para o livro do mês de Março de 2026;Orlando - Virginia Woolf (288 p.),Mrs. Dalloway - Virginia Woolf (240 p.),Britt-Marie esteve aqui - Fredrik Backman (304 p.);2;sim
(2º turno) Votação para o livro do mês de Março de 2026;Cafés & Lendas - Travis Baldree (336 p.),Ascensão - Stephen King (144 p.),Senhor das Moscas - William Golding (216 p.),E Não Sobrou Nenhum - Agatha Christie (400 p.);1;sim`}
      </pre>

      <a className="button csv-download-btn" href="/enquetes-exemplo.csv" download="enquetes-exemplo.csv">
        ⬇ Baixar planilha de exemplo (.csv)
      </a>
    </section>
  );
});

function toCommandKey(command) {
  return `${command.type}:${command.name}`;
}

function commandTypeLabel(type) {
  if (type === 2) return 'Contexto (Usuário)';
  if (type === 3) return 'Contexto (Mensagem)';
  return 'Slash Command';
}

function normalizeOptionsText(input) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
}

function parseOptionsCount(input) {
  return normalizeOptionsText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length;
}

const CSV_COMMAND_KEY = 'csv:upload';
const FEEDBACK_TIMEOUT_MS = 4000;
const MODERATION_COMMAND_ORDER = ['criador-de-enquete', 'mensalista'];
const POLL_COMMAND_ORDER = ['enquete', 'rascunho', 'Adicionar/Remover da enquete', 'Encerrar Votação'];

const COMMAND_LABEL_OVERRIDES = {
  'criador-de-enquete': 'Moderadores',
  enquete: 'Nova Enquete',
  rascunho: 'Rascunhos (enquete)',
  'Add/Del Criador de Enquetes': 'Dar Permissão de Votação',
  'Adicionar/Remover da enquete': 'Add/Del da lista de votação',
};

function getDisplayCommandLabel(commandName) {
  return COMMAND_LABEL_OVERRIDES[commandName] || commandName;
}

function getCommandsInOrder(commands, orderedNames) {
  return orderedNames.map((name) => commands.find((command) => command.name === name)).filter(Boolean);
}

export default function App() {
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');

  const [guilds, setGuilds] = useState([]);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [selectedGuildId, setSelectedGuildId] = useState('');

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [expandedCommandKey, setExpandedCommandKey] = useState('');

  const [members, setMembers] = useState([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [mensalistaIds, setMensalistaIds] = useState([]);
  const [criadorIds, setCriadorIds] = useState([]);

  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [pollTargets, setPollTargets] = useState([]);
  const [draftTargets, setDraftTargets] = useState([]);

  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState('');

  const [commandLoadingKey, setCommandLoadingKey] = useState('');
  const [commandFeedbackByKey, setCommandFeedbackByKey] = useState({});
  const commandFeedbackTimersRef = useRef({});
  const csvFeedbackTimerRef = useRef(null);

  const [enqueteForm, setEnqueteForm] = useState({
    titulo: '',
    opcoes: '',
    maxVotos: 1,
    pesoMensalista: 'sim',
  });

  const [rascunhoForm, setRascunhoForm] = useState({
    subcommand: 'criar',
    id: '',
    titulo: '',
    opcoes: '',
    maxVotos: 1,
    pesoMensalista: 'nao',
    canal: '',
    opcao: '',
  });

  const [mensalistaForm, setMensalistaForm] = useState({ subcommand: 'adicionar', usuario: '' });
  const [criadorForm, setCriadorForm] = useState({ subcommand: 'adicionar', usuario: '' });
  const [contextUserTargetId, setContextUserTargetId] = useState('');
  const [contextMessageForm, setContextMessageForm] = useState({ pollMessageId: '', optionText: '' });

  const dashboardCommandGroups = useMemo(() => {
    return {
      moderation: getCommandsInOrder(catalog, MODERATION_COMMAND_ORDER),
      polls: getCommandsInOrder(catalog, POLL_COMMAND_ORDER),
    };
  }, [catalog]);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const payload = await getCurrentSession();
        setSession(payload.user);

        const [guildsPayload, catalogPayload] = await Promise.all([getGuilds(), getCommandCatalog()]);

        const loadedGuilds = guildsPayload.guilds || [];
        setGuilds(loadedGuilds);
        setSelectedGuildId(loadedGuilds[0]?.id || payload.user.guildId || '');

        const loadedCatalog = (catalogPayload.commands || []).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setCatalog(loadedCatalog);
      } catch (error) {
        setSession(null);
        setSessionError(error.message || 'Sessão não autenticada');
      } finally {
        setGuildsLoading(false);
        setCatalogLoading(false);
        setLoadingSession(false);
      }
    }

    bootstrapSession();
  }, []);

  useEffect(() => {
    if (!selectedGuildId || !session) return;

    setSelectedChannelId('');

    async function loadGuildStaticData() {
      try {
        const [channelsPayload, pollsPayload, mensalistasPayload, criadoresPayload] = await Promise.all([
          getGuildChannels(selectedGuildId),
          getPollContextTargets(selectedGuildId),
          getGroupMembers(selectedGuildId, 'mensalistas'),
          getGroupMembers(selectedGuildId, 'criadores'),
        ]);

        const draftsPayload = await getDraftContextTargets();

        // Tipos de canal de voz/palco (discord.js ChannelType): 2 = GuildVoice, 13 = GuildStageVoice
        setChannels((channelsPayload.channels || []).filter((ch) => ch.type !== 2 && ch.type !== 13));
        setPollTargets(pollsPayload.polls || []);
        setDraftTargets(draftsPayload.drafts || []);
        setMensalistaIds(mensalistasPayload.ids || []);
        setCriadorIds(criadoresPayload.ids || []);
      } catch {
        setChannels([]);
        setPollTargets([]);
        setDraftTargets([]);
        setMensalistaIds([]);
        setCriadorIds([]);
      }
    }

    loadGuildStaticData();
  }, [selectedGuildId, session]);

  useEffect(() => {
    if (!selectedGuildId || !session) return;

    async function loadMembers() {
      try {
        const membersPayload = await getGuildMembers(selectedGuildId, memberQuery);
        setMembers(membersPayload.members || []);
      } catch {
        setMembers([]);
      }
    }

    loadMembers();
  }, [selectedGuildId, session, memberQuery]);

  useEffect(() => {
    return () => {
      Object.values(commandFeedbackTimersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });

      if (csvFeedbackTimerRef.current) {
        clearTimeout(csvFeedbackTimerRef.current);
      }
    };
  }, []);

  function setCommandFeedback(commandKey, status) {
    if (commandFeedbackTimersRef.current[commandKey]) {
      clearTimeout(commandFeedbackTimersRef.current[commandKey]);
    }

    setCommandFeedbackByKey((prev) => ({ ...prev, [commandKey]: status }));

    commandFeedbackTimersRef.current[commandKey] = setTimeout(() => {
      setCommandFeedbackByKey((prev) => {
        const next = { ...prev };
        delete next[commandKey];
        return next;
      });
      delete commandFeedbackTimersRef.current[commandKey];
    }, FEEDBACK_TIMEOUT_MS);
  }

  function setCsvFeedbackWithTimeout(status) {
    if (csvFeedbackTimerRef.current) {
      clearTimeout(csvFeedbackTimerRef.current);
    }

    setCsvFeedback(status);

    csvFeedbackTimerRef.current = setTimeout(() => {
      setCsvFeedback('');
      csvFeedbackTimerRef.current = null;
    }, FEEDBACK_TIMEOUT_MS);
  }

  async function handleLogout() {
    try {
      await logoutSession();
    } catch {
      // no-op
    } finally {
      setSession(null);
      setSessionError('Sessão encerrada. Faça login novamente.');
    }
  }

  async function handleCsvSubmit(event) {
    event.preventDefault();
    if (!csvFile) {
      setCsvFeedbackWithTimeout('error');
      return;
    }

    setCsvLoading(true);
    setCsvFeedback('');

    try {
      await uploadCsv(csvFile);
      const draftsPayload = await getDraftContextTargets();
      setDraftTargets(draftsPayload.drafts || []);
      setCsvFeedbackWithTimeout('success');
    } catch {
      setCsvFeedbackWithTimeout('error');
    } finally {
      setCsvLoading(false);
    }
  }

  function toggleCommandPanel(commandKey) {
    setExpandedCommandKey((prev) => (prev === commandKey ? '' : commandKey));
  }

  async function handleCommandSubmit(event, command) {
    event.preventDefault();

    const commandKey = toCommandKey(command);
    const setFailure = () => {
      setCommandFeedback(commandKey, 'error');
    };

    if (!command || !selectedGuildId) {
      setFailure();
      return;
    }

    if (command.type === 1 && !selectedChannelId) {
      setFailure();
      return;
    }

    let options = {};
    let target = undefined;

    const ensure = (condition) => {
      if (!condition) {
        setFailure();
        return false;
      }
      return true;
    };

    if (command.type === 1 && command.name === 'enquete') {
      if (!ensure(enqueteForm.titulo.trim())) return;
      const optionsCount = parseOptionsCount(enqueteForm.opcoes);
      if (!ensure(optionsCount >= 2)) return;
      if (!ensure(Number(enqueteForm.maxVotos) >= 1)) return;

      options = {
        'nome-da-enquete': enqueteForm.titulo.trim(),
        opcoes: normalizeOptionsText(enqueteForm.opcoes),
        max_votos: Number(enqueteForm.maxVotos),
        peso_mensalista: enqueteForm.pesoMensalista,
      };
    }

    if (command.type === 1 && command.name === 'rascunho') {
      if (!ensure(rascunhoForm.subcommand === 'listar' || rascunhoForm.id.trim())) {
        return;
      }

      if (['criar', 'editar', 'adicionar-opcao'].includes(rascunhoForm.subcommand)) {
        const optionsCount = parseOptionsCount(rascunhoForm.opcoes);
        if (rascunhoForm.subcommand === 'criar' && !ensure(optionsCount >= 2)) {
          return;
        }
        if (rascunhoForm.subcommand === 'adicionar-opcao' && !ensure(optionsCount >= 1)) {
          return;
        }
      }

      const common = {
        id: rascunhoForm.id.trim(),
        titulo: rascunhoForm.titulo.trim(),
        opcoes: normalizeOptionsText(rascunhoForm.opcoes),
        max_votos: rascunhoForm.maxVotos ? Number(rascunhoForm.maxVotos) : undefined,
        peso_mensalista: rascunhoForm.pesoMensalista,
        canal: rascunhoForm.canal || undefined,
        opcao: rascunhoForm.opcao.trim(),
      };

      const subcommandValues = {};
      if (rascunhoForm.subcommand === 'criar') {
        subcommandValues.titulo = common.titulo;
        subcommandValues.opcoes = common.opcoes;
        subcommandValues.max_votos = Number(common.max_votos || 1);
        subcommandValues.peso_mensalista = common.peso_mensalista;
      }

      if (rascunhoForm.subcommand === 'editar') {
        subcommandValues.id = common.id;
        if (common.titulo) subcommandValues.titulo = common.titulo;
        if (common.opcoes) subcommandValues.opcoes = common.opcoes;
        if (common.max_votos) subcommandValues.max_votos = common.max_votos;
        subcommandValues.peso_mensalista = common.peso_mensalista;
      }

      if (rascunhoForm.subcommand === 'adicionar-opcao') {
        subcommandValues.id = common.id;
        subcommandValues.opcoes = common.opcoes;
      }

      if (rascunhoForm.subcommand === 'remover-opcao') {
        subcommandValues.id = common.id;
        subcommandValues.opcao = common.opcao;
      }

      if (rascunhoForm.subcommand === 'exibir' || rascunhoForm.subcommand === 'deletar') {
        subcommandValues.id = common.id;
      }

      if (rascunhoForm.subcommand === 'publicar') {
        subcommandValues.id = common.id;
        if (common.canal) subcommandValues.canal = common.canal;
      }

      options = {
        subcommand: rascunhoForm.subcommand,
        values: subcommandValues,
      };
    }

    if (command.type === 1 && command.name === 'mensalista') {
      if (mensalistaForm.subcommand !== 'listar' && !ensure(mensalistaForm.usuario)) return;
      options = {
        subcommand: mensalistaForm.subcommand,
        values: mensalistaForm.subcommand === 'listar' ? {} : { usuario: mensalistaForm.usuario },
      };
    }

    if (command.type === 1 && command.name === 'criador-de-enquete') {
      if (criadorForm.subcommand !== 'listar' && !ensure(criadorForm.usuario)) return;
      options = {
        subcommand: criadorForm.subcommand,
        values: criadorForm.subcommand === 'listar' ? {} : { usuario: criadorForm.usuario },
      };
    }

    if (command.type === 2) {
      if (!ensure(contextUserTargetId)) return;
      target = {
        userId: contextUserTargetId,
      };
    }

    if (command.type === 3 && command.name === 'Encerrar Votação') {
      if (!ensure(contextMessageForm.pollMessageId)) return;
      const targetPoll = pollTargets.find((entry) => entry.messageId === contextMessageForm.pollMessageId);
      target = {
        messageId: contextMessageForm.pollMessageId,
        messageContent: targetPoll?.title || '',
      };
    }

    if (command.type === 3 && command.name === 'Adicionar/Remover da enquete') {
      if (!ensure(contextMessageForm.optionText.trim())) return;
      target = {
        messageId: contextMessageForm.pollMessageId || `dashboard-${Date.now()}`,
        messageContent: contextMessageForm.optionText,
      };
    }

    if (command.type === 1) {
      target = { channelId: selectedChannelId };
    }

    setCommandLoadingKey(commandKey);
    setCommandFeedbackByKey((prev) => {
      const next = { ...prev };
      delete next[commandKey];
      return next;
    });

    try {
      await executeCommand({
        commandName: command.name,
        commandType: command.type,
        options,
        guildId: selectedGuildId,
        target,
      });
      setCommandFeedback(commandKey, 'success');

      if (command.name === 'mensalista' && options?.subcommand !== 'listar') {
        const userId = mensalistaForm.usuario;
        if (options.subcommand === 'adicionar') {
          setMensalistaIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        } else if (options.subcommand === 'remover') {
          setMensalistaIds((prev) => prev.filter((id) => id !== userId));
        }
        setMensalistaForm((prev) => ({ ...prev, usuario: '' }));
      }

      if (command.name === 'criador-de-enquete' && options?.subcommand !== 'listar') {
        const userId = criadorForm.usuario;
        if (options.subcommand === 'adicionar') {
          setCriadorIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        } else if (options.subcommand === 'remover') {
          setCriadorIds((prev) => prev.filter((id) => id !== userId));
        }
        setCriadorForm((prev) => ({ ...prev, usuario: '' }));
      }
    } catch {
      setCommandFeedback(commandKey, 'error');
    } finally {
      setCommandLoadingKey('');
    }
  }

  function renderCommandForm(command) {
    if (command.type === 1 && command.name === 'enquete') {
      return (
        <div className="form-grid">
          <label>
            Nome da enquete
            <input
              type="text"
              value={enqueteForm.titulo}
              onChange={(event) => setEnqueteForm((prev) => ({ ...prev, titulo: event.target.value }))}
            />
          </label>
          <label>
            Opções (separadas por vírgula)
            <textarea
              rows={3}
              value={enqueteForm.opcoes}
              onChange={(event) => setEnqueteForm((prev) => ({ ...prev, opcoes: event.target.value }))}
            />
          </label>
          <label>
            Máximo de votos
            <input
              type="number"
              min={1}
              value={enqueteForm.maxVotos}
              onChange={(event) => setEnqueteForm((prev) => ({ ...prev, maxVotos: event.target.value }))}
            />
          </label>
          <label>
            Peso mensalista
            <select
              value={enqueteForm.pesoMensalista}
              onChange={(event) => setEnqueteForm((prev) => ({ ...prev, pesoMensalista: event.target.value }))}
            >
              <option value="sim">Sim - peso 2</option>
              <option value="nao">Não - peso 1</option>
            </select>
          </label>
        </div>
      );
    }

    if (command.type === 1 && command.name === 'rascunho') {
      return (
        <div className="form-grid">
          <label>
            Ação de rascunho
            <select
              value={rascunhoForm.subcommand}
              onChange={(event) => setRascunhoForm((prev) => ({ ...prev, subcommand: event.target.value }))}
            >
              <option value="criar">Criar</option>
              <option value="editar">Editar</option>
              <option value="adicionar-opcao">Adicionar opção</option>
              <option value="remover-opcao">Remover opção</option>
              <option value="publicar">Publicar</option>
              <option value="deletar">Deletar</option>
            </select>
          </label>

          {rascunhoForm.subcommand !== 'listar' && rascunhoForm.subcommand !== 'criar' && (
            <label>
              ID do rascunho
              <select
                value={rascunhoForm.id}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, id: event.target.value }))}
              >
                <option value="">Selecione um rascunho</option>
                {draftTargets.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.id} - {draft.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(rascunhoForm.subcommand === 'criar' || rascunhoForm.subcommand === 'editar') && (
            <label>
              Título
              <input
                type="text"
                value={rascunhoForm.titulo}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, titulo: event.target.value }))}
              />
            </label>
          )}

          {(rascunhoForm.subcommand === 'criar' ||
            rascunhoForm.subcommand === 'editar' ||
            rascunhoForm.subcommand === 'adicionar-opcao' ||
            rascunhoForm.subcommand === 'remover-opcao') && (
            <label>
              Opções (separadas por vírgula)
              <textarea
                rows={3}
                value={rascunhoForm.opcoes}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, opcoes: event.target.value }))}
              />
            </label>
          )}

          {(rascunhoForm.subcommand === 'criar' || rascunhoForm.subcommand === 'editar') && (
            <label>
              Máximo de votos
              <input
                type="number"
                min={1}
                value={rascunhoForm.maxVotos}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, maxVotos: event.target.value }))}
              />
            </label>
          )}

          {(rascunhoForm.subcommand === 'criar' || rascunhoForm.subcommand === 'editar') && (
            <label>
              Peso mensalista
              <select
                value={rascunhoForm.pesoMensalista}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, pesoMensalista: event.target.value }))}
              >
                <option value="sim">Sim - peso 2</option>
                <option value="nao">Não - peso 1</option>
              </select>
            </label>
          )}

          {rascunhoForm.subcommand === 'publicar' && (
            <label>
              Canal de publicação
              <select
                value={rascunhoForm.canal}
                onChange={(event) => setRascunhoForm((prev) => ({ ...prev, canal: event.target.value }))}
              >
                <option value="">Canal atual (padrão)</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      );
    }

    if (command.type === 1 && command.name === 'mensalista') {
      const availableMembers =
        mensalistaForm.subcommand === 'adicionar'
          ? members.filter((m) => !mensalistaIds.includes(m.id))
          : members.filter((m) => mensalistaIds.includes(m.id));

      const isLoadingMembers = members.length === 0;
      const noAvailableMembers = !isLoadingMembers && availableMembers.length === 0;
      const placeholderText = isLoadingMembers
        ? 'Carregando membros...'
        : noAvailableMembers
          ? mensalistaForm.subcommand === 'adicionar'
            ? 'Nenhum usuário disponível para adicionar.'
            : 'Nenhum usuário disponível para remover.'
          : 'Selecione um usuário';

      return (
        <div className="form-grid">
          <label>
            Ação
            <select
              value={mensalistaForm.subcommand}
              onChange={(event) =>
                setMensalistaForm((prev) => ({ ...prev, subcommand: event.target.value, usuario: '' }))
              }
            >
              <option value="adicionar">Adicionar</option>
              <option value="remover">Remover</option>
            </select>
          </label>

          {mensalistaForm.subcommand !== 'listar' && (
            <label>
              Usuário
              <select
                value={mensalistaForm.usuario}
                onChange={(event) => setMensalistaForm((prev) => ({ ...prev, usuario: event.target.value }))}
                disabled={isLoadingMembers || noAvailableMembers}
              >
                <option value="">{placeholderText}</option>
                {!isLoadingMembers &&
                  !noAvailableMembers &&
                  availableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.username})
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
      );
    }

    if (command.type === 1 && command.name === 'criador-de-enquete') {
      const availableMembers =
        criadorForm.subcommand === 'adicionar'
          ? members.filter((m) => !criadorIds.includes(m.id))
          : members.filter((m) => criadorIds.includes(m.id));

      const isLoadingMembers = members.length === 0;
      const noAvailableMembers = !isLoadingMembers && availableMembers.length === 0;
      const placeholderText = isLoadingMembers
        ? 'Carregando membros...'
        : noAvailableMembers
          ? criadorForm.subcommand === 'adicionar'
            ? 'Nenhum usuário disponível para adicionar.'
            : 'Nenhum usuário disponível para remover.'
          : 'Selecione um usuário';

      return (
        <div className="form-grid">
          <label>
            Ação
            <select
              value={criadorForm.subcommand}
              onChange={(event) => setCriadorForm((prev) => ({ ...prev, subcommand: event.target.value, usuario: '' }))}
            >
              <option value="adicionar">Adicionar</option>
              <option value="remover">Remover</option>
            </select>
          </label>

          {criadorForm.subcommand !== 'listar' && (
            <label>
              Usuário
              <select
                value={criadorForm.usuario}
                onChange={(event) => setCriadorForm((prev) => ({ ...prev, usuario: event.target.value }))}
                disabled={isLoadingMembers || noAvailableMembers}
              >
                <option value="">{placeholderText}</option>
                {!isLoadingMembers &&
                  !noAvailableMembers &&
                  availableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.username})
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
      );
    }

    if (command.type === 2) {
      return (
        <div className="form-grid">
          <label>
            Buscar membro
            <input
              type="text"
              value={memberQuery}
              placeholder="Digite para filtrar membros"
              onChange={(event) => setMemberQuery(event.target.value)}
            />
          </label>
          <label>
            Usuário alvo
            <select value={contextUserTargetId} onChange={(event) => setContextUserTargetId(event.target.value)}>
              <option value="">Selecione um usuário</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName} ({member.username})
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    if (command.type === 3 && command.name === 'Encerrar Votação') {
      return (
        <div className="form-grid">
          <label>
            Enquete ativa
            <select
              value={contextMessageForm.pollMessageId}
              onChange={(event) => setContextMessageForm((prev) => ({ ...prev, pollMessageId: event.target.value }))}
            >
              <option value="">Selecione uma enquete ativa</option>
              {pollTargets.map((poll) => (
                <option key={poll.messageId} value={poll.messageId}>
                  {poll.title} (#{poll.channelId})
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    if (command.type === 3 && command.name === 'Adicionar/Remover da enquete') {
      return (
        <div className="form-grid">
          <label>
            Texto da opção
            <input
              type="text"
              value={contextMessageForm.optionText}
              onChange={(event) => setContextMessageForm((prev) => ({ ...prev, optionText: event.target.value }))}
              placeholder="Ex.: Livro X - Autor Y"
            />
          </label>
          <label>
            Vincular a uma enquete ativa (opcional)
            <select
              value={contextMessageForm.pollMessageId}
              onChange={(event) => setContextMessageForm((prev) => ({ ...prev, pollMessageId: event.target.value }))}
            >
              <option value="">Sem vínculo explícito</option>
              {pollTargets.map((poll) => (
                <option key={poll.messageId} value={poll.messageId}>
                  {poll.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    return <p>Comando disponível no catálogo, mas sem template visual dedicado.</p>;
  }

  if (loadingSession) {
    return <main className="app-shell">Carregando sessão...</main>;
  }

  if (!session) {
    return (
      <main className="app-shell">
        <section className="card">
          <h1>Dashboard Little Boat Poll</h1>
          <p>Faça login para acessar o painel administrativo.</p>
          <a className="button" href="/api/auth/discord/login">
            Entrar com Discord
          </a>
          {sessionError && <p className="error-message">{sessionError}</p>}
        </section>
      </main>
    );
  }

  function renderCommandOption(command, fallbackDescription) {
    const commandKey = toCommandKey(command);
    const expanded = expandedCommandKey === commandKey;
    const loading = commandLoadingKey === commandKey;
    const commandFeedback = commandFeedbackByKey[commandKey] || '';
    const displayCommandName = getDisplayCommandLabel(command.name);

    return (
      <div key={commandKey} className={`command-option ${expanded ? 'selected' : ''}`}>
        <button
          type="button"
          className={`command-item ${expanded ? 'selected' : ''}`}
          onClick={() => toggleCommandPanel(commandKey)}
          aria-expanded={expanded}
        >
          <div className="command-item-header">
            <strong>{displayCommandName}</strong>
          </div>
          <span>{command.description || fallbackDescription}</span>
        </button>

        <div className={`command-panel ${expanded ? 'expanded' : ''}`} aria-hidden={!expanded}>
          <div className="command-panel-inner">
            <form onSubmit={(event) => handleCommandSubmit(event, command)} className="form-grid command-panel-content">
              <div className="command-meta">
                <strong>{displayCommandName}</strong>
                <span>{commandTypeLabel(command.type)}</span>
              </div>

              {renderCommandForm(command)}

              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Executando...' : 'Executar comando'}
              </button>
            </form>

            <div className={`status-alert-slot ${commandFeedback ? 'visible' : ''}`}>
              {commandFeedback && (
                <div className={`status-alert ${commandFeedback === 'success' ? 'success' : 'error'}`}>
                  {commandFeedback === 'success' ? 'Sucesso' : 'Falhou'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <header className="card header-card">
        <div>
          <h1>Dashboard Little Boat Poll</h1>
          <p>
            Logado como <strong>{session.username}</strong>
          </p>
        </div>
        <button className="button secondary" onClick={handleLogout} type="button">
          Sair
        </button>
      </header>

      <section className="card">
        <h2>Servidor</h2>
        {guildsLoading ? (
          <p>Carregando servidores...</p>
        ) : (
          <>
            <div className="guild-cards">
              {guilds.map((guild) => (
                <button
                  key={guild.id}
                  type="button"
                  className={`guild-card ${selectedGuildId === guild.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGuildId(guild.id)}
                >
                  {guild.icon ? <img src={guild.icon} alt={guild.name} className="guild-avatar" /> : <span>🛳️</span>}
                  <div>
                    <strong>{guild.name}</strong>
                    <p>{guild.isActive ? 'Servidor ativo' : 'Servidor disponível'}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedGuildId && (
              <div className={`channel-selector-row ${!selectedChannelId ? 'channel-required' : ''}`}>
                <label htmlFor="global-channel-select">Canal de publicação</label>
                <select
                  id="global-channel-select"
                  value={selectedChannelId}
                  onChange={(event) => setSelectedChannelId(event.target.value)}
                >
                  <option value="">Selecione um canal...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                {!selectedChannelId && (
                  <p className="channel-hint">⚠️ Selecione um canal antes de executar comandos de slash.</p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="card">
        {catalogLoading ? (
          <p>Carregando catálogo de comandos...</p>
        ) : (
          <div className={`command-groups ${!selectedChannelId ? 'commands-disabled' : ''}`}>
            <div className="command-group-column">
              <h3>Comandos de Enquete</h3>
              <div className="command-list">
                {dashboardCommandGroups.polls.map((command) => renderCommandOption(command, 'Comando de enquete'))}
              </div>
            </div>

            <div className="command-group-column">
              <h3>Moderação</h3>
              <div className="command-list">
                {dashboardCommandGroups.moderation.map((command) =>
                  renderCommandOption(command, 'Comando de moderação'),
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Importação</h2>
        <div className="command-groups">
          <div className="command-group-column">
            <div className="command-list">
              <div className={`command-option csv-option ${expandedCommandKey === CSV_COMMAND_KEY ? 'selected' : ''}`}>
                <button
                  type="button"
                  className={`command-item ${expandedCommandKey === CSV_COMMAND_KEY ? 'selected' : ''}`}
                  onClick={() => toggleCommandPanel(CSV_COMMAND_KEY)}
                  aria-expanded={expandedCommandKey === CSV_COMMAND_KEY}
                >
                  <div className="command-item-header">
                    <strong>Upload CSV</strong>
                  </div>
                  <span>Importa e cria enquetes a partir de arquivo CSV</span>
                </button>

                <div
                  className={`command-panel ${expandedCommandKey === CSV_COMMAND_KEY ? 'expanded' : ''}`}
                  aria-hidden={expandedCommandKey !== CSV_COMMAND_KEY}
                >
                  <div className="command-panel-inner">
                    <div className="command-panel-content form-grid">
                      <form onSubmit={handleCsvSubmit} className="form-grid csv-upload-form">
                        <label>
                          Arquivo CSV
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                          />
                        </label>
                        <button className="button csv-submit-button" type="submit" disabled={csvLoading}>
                          {csvLoading ? 'Enviando...' : 'Enviar CSV'}
                        </button>
                      </form>
                      <div className={`status-alert-slot ${csvFeedback ? 'visible' : ''}`}>
                        {csvFeedback && (
                          <div className={`status-alert ${csvFeedback === 'success' ? 'success' : 'error'}`}>
                            {csvFeedback === 'success' ? 'Sucesso' : 'Falhou'}
                          </div>
                        )}
                      </div>
                      <CsvFormatGuide />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
