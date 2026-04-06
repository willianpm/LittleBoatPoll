import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Clock, Users, Hash } from 'lucide-react';
import { getPollHistory, type DashboardPoll } from '../lib/dashboard-api';

export function ActivePolls() {
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivePolls() {
      setIsLoading(true);
      setError(null);

      try {
        const allPolls = await getPollHistory();
        if (!isMounted) return;
        setPolls(allPolls);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar enquetes ativas');
        setPolls([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadActivePolls();

    return () => {
      isMounted = false;
    };
  }, []);

  const activePolls = useMemo(() => polls.filter((poll) => poll.status === 'active'), [polls]);

  const getTimeRemaining = (endsAt?: string | null) => {
    if (!endsAt) return 'Sem prazo';

    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (Number.isNaN(end.getTime())) return 'Sem prazo';
    if (diff <= 0) return 'Encerrando';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h restantes`;
    return `${hours}h restantes`;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Enquetes Ativas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {activePolls.length} enquete{activePolls.length !== 1 ? 's' : ''} em andamento
        </p>
      </div>

      {isLoading && (
        <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700 mb-4 md:mb-6">
          <p className="text-gray-600 dark:text-gray-400">Carregando enquetes ativas...</p>
        </Card>
      )}

      {!isLoading && error && (
        <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700 mb-4 md:mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {!isLoading &&
          !error &&
          activePolls.map((poll) => {
            const topOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];

            return (
              <Link key={poll.id} to={`/poll/${poll.id}`}>
                <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-base md:text-lg flex-1 dark:text-white">{poll.title}</h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                        Ativa
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{poll.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Hash className="size-3 md:size-4" />
                      <span className="truncate">{poll.serverName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="size-3 md:size-4" />
                      <span>{poll.totalVotes} votos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 md:size-4" />
                      <span>{getTimeRemaining(poll.endsAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;

                      return (
                        <div key={option.id}>
                          <div className="flex items-center justify-between mb-1 text-xs md:text-sm">
                            <span className="flex items-center gap-2 truncate">
                              {option.emoji && <span>{option.emoji}</span>}
                              <span className="dark:text-gray-200">{option.text}</span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                              {option.votes} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>

                  {topOption && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Liderando:{' '}
                        <span className="text-gray-900 dark:text-gray-200">
                          {topOption.emoji} {topOption.text}
                        </span>
                      </p>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}

        {!isLoading && !error && activePolls.length === 0 && (
          <Card className="p-8 md:p-12 text-center lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Nenhuma enquete ativa encontrada.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
