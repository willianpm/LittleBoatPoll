import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getPollHistory, type DashboardPoll } from '../lib/dashboard-api';
import { Search, Calendar, Users, Hash } from 'lucide-react';

export function PollHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPolls() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPollHistory();
        if (!isMounted) return;
        setPolls(data);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar o histórico de enquetes');
        setPolls([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPolls();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && poll.status === 'active') ||
      (statusFilter === 'ended' && poll.status === 'ended');
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    if (!date) return 'Sem data';

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Histórico de Enquetes</h1>
        <p className="text-gray-600 dark:text-gray-400">Todas as enquetes criadas e finalizadas</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Buscar enquetes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="ended">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Carregando histórico de enquetes...</p>
          </Card>
        )}

        {!isLoading && error && (
          <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {!isLoading &&
          !error &&
          filteredPolls.map((poll) => {
            const topOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0] || null;
            const topPercentage =
              topOption && poll.totalVotes > 0 ? Math.round((topOption.votes / poll.totalVotes) * 100) : 0;

            if (!topOption) {
              return (
                <Link key={poll.id} to={`/poll/${poll.id}`}>
                  <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-base md:text-lg flex-1 dark:text-white">{poll.title}</h3>
                          <Badge
                            className={
                              poll.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }
                          >
                            {poll.status === 'active' ? 'Ativa' : 'Encerrada'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Hash className="size-3 md:size-4" />
                            <span className="truncate">{poll.serverName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="size-3 md:size-4" />
                            <span>{poll.totalVotes} votos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 md:size-4" />
                            <span>{formatDate(poll.createdAt || '')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:text-right">
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Vencedor</p>
                        <p className="mb-1 dark:text-white text-sm md:text-base">Sem dados suficientes</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            }

            return (
              <Link key={poll.id} to={`/poll/${poll.id}`}>
                <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-base md:text-lg flex-1 dark:text-white">{poll.title}</h3>
                        <Badge
                          className={
                            poll.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }
                        >
                          {poll.status === 'active' ? 'Ativa' : 'Encerrada'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Hash className="size-3 md:size-4" />
                          <span className="truncate">{poll.serverName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="size-3 md:size-4" />
                          <span>{poll.totalVotes} votos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3 md:size-4" />
                          <span>{formatDate(poll.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Vencedor</p>
                      <p className="mb-1 dark:text-white text-sm md:text-base">
                        {topOption.emoji} {topOption.text}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {topOption.votes} votos ({topPercentage}%)
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}

        {!isLoading && !error && filteredPolls.length === 0 && (
          <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Nenhuma enquete encontrada</p>
          </Card>
        )}
      </div>
    </div>
  );
}
