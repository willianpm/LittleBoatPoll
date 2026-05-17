import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { closePoll, getPollDetail, type DashboardPoll } from '../lib/dashboard-api';
import { ArrowLeft, Calendar, Clock, Hash, Trophy } from 'lucide-react';
import EmojiRenderer from '../components/EmojiRenderer';
import PollParticipants from '../components/PollParticipants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type ParsedDescription = {
  intro: string;
};

function parsePollDescription(description: string | null | undefined): ParsedDescription {
  if (!description) {
    return { intro: 'Sem descrição' };
  }

  const normalized = description.trim();
  const boldMatches = [...normalized.matchAll(/\*\*([^*]+)\*\*/g)].map((match) => match[1].trim());

  if (boldMatches.length >= 2) {
    const intro = normalized.slice(0, normalized.indexOf('**')).replace(/\s+/g, ' ').trim();

    return {
      intro: intro || 'Selecione uma opção:',
    };
  }

  return {
    intro: normalized.replace(/\s+/g, ' '),
  };
}

export function PollDetail() {
  const { id } = useParams();
  const [poll, setPoll] = useState<DashboardPoll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPoll() {
      if (!id) {
        setError('Enquete não encontrada');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getPollDetail(id);
        if (!isMounted) return;
        setPoll(data);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar os detalhes da enquete');
        setPoll(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPoll();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Sem data';

    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <p className="dark:text-white">Carregando detalhes da enquete...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <p className="dark:text-white">{error || 'Enquete não encontrada'}</p>
      </div>
    );
  }

  const COLORS = ['#5865F2', '#EB459E', '#57F287', '#FEE75C', '#ED4245'];

  const chartData = poll.options.map((opt) => ({
    name: opt.text,
    value: opt.votes,
  }));

  const topOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0] || null;
  const parsedDescription = parsePollDescription(poll.description);
  const totalParticipants: number | undefined =
    typeof poll.totalParticipants === 'number'
      ? poll.totalParticipants
      : Array.isArray(poll.participants)
        ? poll.participants.length
        : undefined;
  const totalMensalistas: number | undefined =
    typeof poll.totalMensalistas === 'number'
      ? poll.totalMensalistas
      : Array.isArray(poll.participants)
        ? poll.participants.filter((participant) => participant.isMensalista).length
        : undefined;
  const registeredVotes: number | undefined = Array.isArray(poll.participants)
    ? poll.participants.reduce((sum, p) => sum + (Array.isArray(p.choices) ? p.choices.length : 0), 0)
    : undefined;

  const renderMetric = (v?: number) => (v === undefined ? 'Desconhecido' : String(v));

  async function handleClosePoll() {
    if (!id || !poll || poll.status !== 'active' || isClosing) {
      return;
    }

    setIsClosing(true);
    setCloseError(null);

    try {
      await closePoll({
        pollId: id,
        guildId: poll.serverId,
        channelId: poll.channelId,
      });

      const refreshedPoll = await getPollDetail(id);
      setPoll(refreshedPoll);
    } catch (closePollError) {
      setCloseError(closePollError instanceof Error ? closePollError.message : 'Falha ao encerrar a enquete');
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Link to="/history">
        <Button variant="ghost" className="mb-4 md:mb-6 dark:hover:bg-gray-800">
          <ArrowLeft className="size-4 mr-2" />
          Voltar ao Histórico
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl mb-2 dark:text-white">{poll.title}</h1>
                <div className="mb-4">
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{parsedDescription.intro}</p>
                  {poll.options.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm md:text-base text-gray-600 dark:text-gray-300">
                      {poll.options.map((option) => (
                        <li key={option.id} className="leading-relaxed break-words flex items-center gap-2">
                          <EmojiRenderer
                            emoji={option.emoji}
                            emojiId={option.emojiId}
                            emojiAnimated={option.emojiAnimated}
                            emojiUrl={option.emojiUrl}
                            alt={`Emoji da opção: ${option.text}`}
                            className="size-4 md:size-5 shrink-0 object-contain"
                          />
                          <span>{option.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Hash className="size-3 md:size-4" />
                    <span className="truncate">
                      {poll.serverName} • #{poll.channelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3 md:size-4" />
                    <span className="truncate">{formatDate(poll.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 md:size-4" />
                    <span className="truncate">
                      Termina em {poll.endsAt ? formatDate(poll.endsAt) : 'Sem previsão'}
                    </span>
                  </div>
                </div>
              </div>

              <Badge
                className={
                  poll.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 shrink-0'
                }
              >
                {poll.status === 'active' ? 'Ativa' : 'Encerrada'}
              </Badge>
            </div>

            <div className="flex gap-2 mb-6">
              {poll.allowMultipleChoices && (
                <Badge variant="outline" className="dark:border-gray-600">
                  Múltipla escolha
                </Badge>
              )}
              {poll.anonymous && (
                <Badge variant="outline" className="dark:border-gray-600">
                  Anônima
                </Badge>
              )}
            </div>

            <div className="space-y-3 md:space-y-4">
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                const isTop = topOption ? option.id === topOption.id : false;

                return (
                  <div
                    key={option.id}
                    className={`p-3 md:p-4 rounded-lg border-2 ${
                      isTop
                        ? 'border-[#5865F2] bg-blue-50 dark:bg-blue-900/20 dark:border-[#5865F2]'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="flex items-center gap-2 flex-1 min-w-0">
                        <EmojiRenderer
                          emoji={option.emoji}
                          emojiId={option.emojiId}
                          emojiAnimated={option.emojiAnimated}
                          emojiUrl={option.emojiUrl}
                          alt={`Emoji da opção: ${option.text}`}
                          className="size-4 md:size-5 shrink-0 object-contain"
                        />
                        <span className="text-base md:text-lg dark:text-white truncate">{option.text}</span>
                        {isTop && <Trophy className="size-4 md:size-5 text-[#5865F2] shrink-0" />}
                      </span>
                      <span className="text-sm md:text-lg dark:text-white shrink-0">
                        {option.votes} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2 md:h-3" />
                  </div>
                );
              })}
            </div>
          </Card>

          <PollParticipants participants={poll.participants} anonymous={poll.anonymous} />
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 dark:text-white">Participação</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Participantes únicos</span>
                  <span className="text-lg md:text-xl dark:text-white">{renderMetric(totalParticipants)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                    Mensalistas participantes
                  </span>
                  <span className="text-lg md:text-xl dark:text-white">{renderMetric(totalMensalistas)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 dark:text-white">Votação</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Votos registrados</span>
                  <span className="text-lg md:text-xl dark:text-white">{renderMetric(registeredVotes)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Votos ponderados</span>
                  <span className="text-lg md:text-xl dark:text-white">{poll.totalVotes}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 dark:text-white">Ações</h3>
            <div className="space-y-2">
              {poll.status === 'active' ? (
                <Button
                  variant="destructive"
                  onClick={handleClosePoll}
                  disabled={isClosing}
                  className="w-full justify-start text-sm md:text-base"
                >
                  Encerrar Enquete
                </Button>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">Esta enquete já foi encerrada.</p>
              )}
              {closeError && <p className="text-sm text-red-600 dark:text-red-400">{closeError}</p>}
            </div>
          </Card>

          <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 dark:text-white">Distribuição de Votos</h3>
            {chartData.length > 0 ? (
              <div className="aspect-square max-h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Sem votos suficientes para exibir o gráfico.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
