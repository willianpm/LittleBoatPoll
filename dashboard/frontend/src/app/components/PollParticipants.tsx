import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { PollParticipant } from '../lib/dashboard-api';

export default function PollParticipants({
  participants,
  anonymous,
}: {
  participants?: PollParticipant[];
  anonymous?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const list = Array.isArray(participants) ? participants : [];
  const displayed = showAll ? list : list.slice(0, 10);

  return (
    <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="mb-4 dark:text-white">Participantes ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum participante registrado.</p>
      ) : (
        <ul className="space-y-2">
          {displayed.map((p) => (
            <li key={p.userId} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm md:text-base dark:text-white">
                    {anonymous ? 'Anônimo' : p.username || 'Usuário'}
                  </span>
                  {p.isMensalista && <Badge variant="outline">Mensalista</Badge>}
                </div>
                {!anonymous && p.displayName && p.displayName !== p.username && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Nome visual: {p.displayName}</div>
                )}
                {Array.isArray(p.choices) && p.choices.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Escolhas: {p.choices.join(', ')}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400">{p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      )}
      {list.length > 10 && (
        <div className="mt-3">
          <button className="text-sm text-blue-600 dark:text-blue-400" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Ver menos' : `Ver todos (${list.length})`}
          </button>
        </div>
      )}
    </Card>
  );
}
