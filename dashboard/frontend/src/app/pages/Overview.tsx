import { useEffect, useMemo, useState } from 'react';
import { Activity, TrendingUp, Server } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/ui/card';
import { getGuilds, getPollHistory, type DashboardGuild, type DashboardPoll } from '../lib/dashboard-api';

export function Overview() {
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [guilds, setGuilds] = useState<DashboardGuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      setIsLoading(true);
      setError(null);

      try {
        const [pollHistory, guildList] = await Promise.all([getPollHistory(), getGuilds()]);

        if (!isMounted) return;

        setPolls(pollHistory);
        setGuilds(guildList);
      } catch (loadError) {
        if (!isMounted) return;

        setPolls([]);
        setGuilds([]);
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar a visão geral');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedPolls = useMemo(() => {
    return [...polls].sort((left, right) => {
      const leftDate = new Date(left.endsAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.endsAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });
  }, [polls]);

  const activePolls = useMemo(() => sortedPolls.filter((poll) => poll.status === 'active'), [sortedPolls]);
  const endedPolls = useMemo(() => sortedPolls.filter((poll) => poll.status === 'ended'), [sortedPolls]);
  const totalVotes = useMemo(
    () => sortedPolls.reduce((sum, poll) => sum + (Number(poll.totalVotes) || 0), 0),
    [sortedPolls],
  );

  const statusData = [
    { name: 'Ativas', value: activePolls.length },
    { name: 'Encerradas', value: endedPolls.length },
  ];

  const COLORS = ['#5865F2', '#EB459E'];
  const recentPolls = sortedPolls.slice(0, 4);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Visão Geral</h1>
        <p className="text-gray-600 dark:text-gray-400">Dashboard de estatísticas do Little Boat Poll</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="size-5 md:size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
              {polls.length > 0 ? `${activePolls.length}/${polls.length}` : '0/0'}
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Enquetes Ativas</h3>
          <p className="text-2xl md:text-3xl dark:text-white">{isLoading ? '...' : activePolls.length}</p>
        </Card>

        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Server className="size-5 md:size-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
              {isLoading ? 'Carregando' : `${guilds.length} servidores`}
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Servidores Conectados</h3>
          <p className="text-2xl md:text-3xl dark:text-white">{isLoading ? '...' : guilds.length}</p>
        </Card>

        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="size-5 md:size-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
              {polls.length > 0 ? `${endedPolls.length} encerradas` : '0 encerradas'}
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total de Votos</h3>
          <p className="text-2xl md:text-3xl dark:text-white">{isLoading ? '...' : totalVotes}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 md:mb-6 dark:text-white">Status das Enquetes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 dark:text-gray-200">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 md:mb-6 dark:text-white">Enquetes Recentes</h3>
          <div className="space-y-3 md:space-y-4">
            {isLoading && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
                Carregando histórico de enquetes...
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {!isLoading &&
              !error &&
              recentPolls.map((poll) => (
                <div
                  key={poll.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 dark:text-white text-sm md:text-base truncate">{poll.title}</p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span className="truncate">{poll.serverName}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{poll.totalVotes} votos</span>
                      <span className="hidden sm:inline">•</span>
                      <span
                        className={
                          poll.status === 'active'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      >
                        {poll.status === 'active' ? 'Ativa' : 'Encerrada'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {!isLoading && !error && recentPolls.length === 0 && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
                Nenhuma enquete encontrada no histórico.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
