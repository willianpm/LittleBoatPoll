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

import Layout from './components/ui/Layout';
import Panel from './components/ui/Panel';
import GuildChannelSelector from './components/ui/GuildChannelSelector';
import CommandPanel from './components/ui/CommandPanel';

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

function isSameEnqueteForm(left, right) {
  if (!left || !right) return false;
  return (
    left.titulo === right.titulo &&
    left.opcoes === right.opcoes &&
    String(left.maxVotos) === String(right.maxVotos) &&
    left.pesoMensalista === right.pesoMensalista
  );
}

function isSameRascunhoForm(left, right) {
  if (!left || !right) return false;
  return (
    left.subcommand === right.subcommand &&
    left.id === right.id &&
    left.titulo === right.titulo &&
    left.opcoes === right.opcoes &&
    String(left.maxVotos) === String(right.maxVotos) &&
    left.pesoMensalista === right.pesoMensalista &&
    left.canal === right.canal &&
    left.opcao === right.opcao
  );
}

function getUserNameById(userId, members) {
  if (!userId) return null;
  if (!members?.length) return null;
  const user = members.find((member) => member.id === userId || member.userId === userId);
  if (!user) return null;
  return user.displayName || user.username || user.name || null;
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
  const [currentSection, setCurrentSection] = useState('painel');

  const [guilds, setGuilds] = useState([]);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const selectedGuildIdRef = useRef('');

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [expandedCommandKey, setExpandedCommandKey] = useState('');

  const [members, setMembers] = useState([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [mensalistaIds, setMensalistaIds] = useState([]);
  const [criadorIds, setCriadorIds] = useState([]);

  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 600px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(max-width: 600px)');
    const handler = (event) => setIsMobile(event.matches);
    handler(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

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

  const commandsDisabled = !selectedGuildId || !selectedChannelId;

  const selectedGuildChannelIds = useMemo(() => {
    if (!selectedGuildId) return [];
    return channels.map((channel) => channel.id);
  }, [channels, selectedGuildId]);

  const currentPollTargets = useMemo(() => {
    if (!selectedGuildId) return [];
    return pollTargets.filter((poll) => selectedGuildChannelIds.includes(poll.channelId));
  }, [pollTargets, selectedGuildChannelIds, selectedGuildId]);

  const currentDraftTargets = useMemo(() => {
    if (!selectedGuildId) return [];
    // fallback for drafts without guild info
    return draftTargets.filter((draft) => !draft.guildId || draft.guildId === selectedGuildId);
  }, [draftTargets, selectedGuildId]);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const payload = await getCurrentSession();
        setSession(payload.user);

        const [guildsPayload, catalogPayload] = await Promise.all([getGuilds(), getCommandCatalog()]);

        const loadedGuilds = guildsPayload.guilds || [];
        setGuilds(loadedGuilds);
        setSelectedGuildId(''); // não selecionar automaticamente, força o usuário escolher

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
    setChannelsLoading(true);

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
      } finally {
        setChannelsLoading(false);
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
    selectedGuildIdRef.current = selectedGuildId;
  }, [selectedGuildId]);

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

  async function refreshDraftTargets(errorMessage) {
    try {
      const draftsPayload = await getDraftContextTargets();
      setDraftTargets(draftsPayload.drafts || []);
    } catch (error) {
      console.debug(errorMessage, error);
    }
  }

  async function refreshPollTargets(guildId, errorMessage) {
    try {
      const pollsPayload = await getPollContextTargets(guildId);
      if (selectedGuildIdRef.current === guildId) {
        setPollTargets(pollsPayload.polls || []);
      }
    } catch (error) {
      console.debug(errorMessage, error);
    }
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
      // Upload é a operação principal: se deu certo, não deve virar erro por falha no refresh.
      await uploadCsv(csvFile);

      // Refresh best-effort da lista de rascunhos.
      // Não reverte feedback de sucesso do upload por falha secundária de refresh.
      await refreshDraftTargets('[App] Falha ao atualizar lista de rascunhos após upload CSV');

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
    const commandGuildId = selectedGuildId;
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

    const submittedEnqueteForm = command.name === 'enquete' ? { ...enqueteForm } : null;
    const submittedRascunhoForm = command.name === 'rascunho' ? { ...rascunhoForm } : null;

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
        guildId: commandGuildId,
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

      if (command.name === 'enquete') {
        setEnqueteForm((prev) => {
          const sameSubmittedState = isSameEnqueteForm(prev, submittedEnqueteForm);
          const stillSameGuild = selectedGuildIdRef.current === commandGuildId;
          if (!sameSubmittedState || !stillSameGuild) {
            return prev;
          }

          return {
            titulo: '',
            opcoes: '',
            maxVotos: 1,
            pesoMensalista: 'sim',
          };
        });
      }

      if (command.name === 'rascunho' && (options?.subcommand === 'criar' || options?.subcommand === 'publicar')) {
        setRascunhoForm((prev) => {
          const sameSubmittedState = isSameRascunhoForm(prev, submittedRascunhoForm);
          const stillSameGuild = selectedGuildIdRef.current === commandGuildId;
          if (!sameSubmittedState || !stillSameGuild) {
            return prev;
          }

          return {
            subcommand: options.subcommand,
            id: '',
            titulo: '',
            opcoes: '',
            maxVotos: 1,
            pesoMensalista: 'nao',
            canal: '',
            opcao: '',
          };
        });
      }

      if (command.name === 'enquete' || (command.name === 'Encerrar Votação' && command.type === 3)) {
        await refreshPollTargets(commandGuildId, '[App] Falha ao atualizar lista de enquetes após comando');
      }

      if (command.name === 'rascunho' && options?.subcommand !== 'listar' && options?.subcommand !== 'exibir') {
        await refreshDraftTargets('[App] Falha ao atualizar lista de rascunhos após comando');

        if (options?.subcommand === 'publicar') {
          await refreshPollTargets(commandGuildId, '[App] Falha ao atualizar lista de enquetes após publicar rascunho');
        }
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
    <Layout
      currentSection={currentSection}
      onNavigate={setCurrentSection}
      user={session}
      onLogout={handleLogout}
      isMobile={isMobile}
      sidebarConfig={{
        guilds,
        guildsLoading,
        selectedGuildId,
        setSelectedGuildId,
        channels,
        channelsLoading,
        selectedChannelId,
        setSelectedChannelId,
      }}
    >
      <Panel title="Acesso do Usuário">
        <div className="user-access-row">
          <span>
            Logado como <strong>{session.username}</strong>
          </span>
          <button className="button secondary" onClick={handleLogout} type="button">
            Sair
          </button>
        </div>
      </Panel>

      {currentSection === 'painel' && (
        <>
          <Panel title="Bem-vindo ao ⛵">
            <p style={{ marginBottom: 12 }}>Sua central administrativa para gerenciar enquetes com agilidade.</p>

            <p style={{ marginBottom: 16 }}>Após escolher o seu servidor e canal, você pode:</p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 16 }}>
              <li>
                <strong>Comandos Rápidos</strong>
                <br />
                No menu <strong>Comandos</strong>, selecione o servidor e o canal para interagir em tempo real.
              </li>

              <li>
                <strong>Gestão em Massa</strong>
                <br />
                Utilize a <strong>Importação CSV</strong> para criar várias enquetes de uma só vez.
              </li>

              <li>
                <strong>Foco no que importa</strong>
                <br />
                Suas seleções de servidor e canal são mantidas automaticamente enquanto você navega, evitando
                configurações repetitivas.
              </li>
            </ul>
          </Panel>

          {selectedGuildId ? (
            <Panel title="Resumo de Enquetes">
              <div className="dashboard-stats-grid">
                <div className="stat-card">
                  <strong>{currentPollTargets.length}</strong>
                  <span>Enquetes ativas</span>
                </div>

                <div className="stat-card">
                  <strong>{currentDraftTargets.length}</strong>
                  <span>Rascunhos disponíveis</span>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="Resumo de Enquetes">
              <p>Selecione um servidor para visualizar as estatísticas.</p>
            </Panel>
          )}
        </>
      )}

      {currentSection === 'comandos' && (
        <>
          {isMobile && (
            <Panel title="Servidor e Canal">
              <GuildChannelSelector
                guilds={guilds}
                guildsLoading={guildsLoading}
                selectedGuildId={selectedGuildId}
                setSelectedGuildId={setSelectedGuildId}
                channels={channels}
                channelsLoading={channelsLoading}
                selectedChannelId={selectedChannelId}
                setSelectedChannelId={setSelectedChannelId}
              />
            </Panel>
          )}

          <Panel>
            {catalogLoading ? (
              <p>Carregando catálogo de comandos...</p>
            ) : (
              <div className={`command-groups ${commandsDisabled ? 'commands-disabled' : ''}`}>
                <div className="command-group-column">
                  <div className="command-list">
                    {dashboardCommandGroups.polls.map((command) => (
                      <CommandPanel
                        key={`${command.type}:${command.name}`}
                        command={command}
                        expanded={expandedCommandKey === `${command.type}:${command.name}`}
                        onToggle={toggleCommandPanel}
                        onSubmit={handleCommandSubmit}
                        renderCommandForm={renderCommandForm}
                        loading={commandLoadingKey === `${command.type}:${command.name}`}
                        feedback={commandFeedbackByKey[`${command.type}:${command.name}`] || ''}
                        fallbackDescription="Comando de enquete"
                        commandTypeLabel={commandTypeLabel}
                        getDisplayCommandLabel={getDisplayCommandLabel}
                        disabled={commandsDisabled}
                      />
                    ))}
                  </div>
                </div>

                <div className="command-group-column">
                  <div className="command-list">
                    {dashboardCommandGroups.moderation.map((command) => (
                      <CommandPanel
                        key={`${command.type}:${command.name}`}
                        command={command}
                        expanded={expandedCommandKey === `${command.type}:${command.name}`}
                        onToggle={toggleCommandPanel}
                        onSubmit={handleCommandSubmit}
                        renderCommandForm={renderCommandForm}
                        loading={commandLoadingKey === `${command.type}:${command.name}`}
                        feedback={commandFeedbackByKey[`${command.type}:${command.name}`] || ''}
                        fallbackDescription="Comando de moderação"
                        commandTypeLabel={commandTypeLabel}
                        getDisplayCommandLabel={getDisplayCommandLabel}
                        disabled={commandsDisabled}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </>
      )}

      {currentSection === 'importacao' && (
        <Panel title="Importação CSV">
          <p>Use essa seção para importar enquetes a partir de planilhas CSV.</p>
          <ul>
            <li>Baixe o modelo de CSV na seção de instruções abaixo.</li>
            <li>Preencha 4 colunas: nome-da-enquete, opcoes, max_votos, peso_mensalistas.</li>
            <li>Envie o arquivo e aguarde a confirmação de sucesso.</li>
            <li>Após o upload, sua enquete ficará como rascunho para publicação na área de Comandos.</li>
          </ul>

          <div className="command-groups">
            <div className="command-group-column">
              <div className="command-list">
                <div
                  className={`command-option csv-option ${expandedCommandKey === CSV_COMMAND_KEY ? 'selected' : ''}`}
                >
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
        </Panel>
      )}
    </Layout>
  );
}
