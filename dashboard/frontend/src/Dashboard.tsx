import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './faces/HomePage';
import { MenuPage } from './faces/MenuPage';
import { CreatePollPage } from './faces/poll/CreatePollPage';
import { ActivePollPage } from './faces/poll/ActivePollPage';
import { EditDraftPage } from './faces/draft/EditDraftPage';
import { SendDraftPage } from './faces/draft/SendDraftPage';
import { CreateDraftPage } from './faces/draft/CreateDraftPage';
import { GuildContext } from './utils/contexts/GuildContext';
import { GuildSelectPage } from './faces/GuildSelectPage';
import { AppBar } from './modules/AppBar';
import { EndActivePollPage } from './faces/poll/EndActivePollPage';
import { DeleteDraftPage } from './faces/draft/DeleteDraftPage';
import { EditMensalistas } from './faces/config/EditMensalistas';
import { EditCriadores } from './faces/config/EditCriadores';

function Dashboard() {

  const [guildId, setGuildId] = useState('11111');
  const updateGuildId = (id: string) => setGuildId(id);
  
  return (
    <GuildContext.Provider value={{guildId, updateGuildId,}}>
      <Routes>
        <Route path="/dashboard/*" element={<AppBar />} />
      </Routes>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guild" element={<GuildSelectPage />} />
        <Route path="/dashboard/menu" element={<MenuPage />} />
        <Route path="/dashboard/poll/create" element={<CreatePollPage />} />
        <Route path="/dashboard/poll/active" element={<ActivePollPage />} />
        <Route path="/dashboard/poll/end" element={<EndActivePollPage />} />
        <Route path="/dashboard/draft/create" element={<CreateDraftPage />}/>
        <Route path="/dashboard/draft/edit" element={<EditDraftPage />}/>
        <Route path="/dashboard/draft/send" element={<SendDraftPage />}/>
        <Route path="/dashboard/draft/delete" element={<DeleteDraftPage />}/>
        <Route path="/dashboard/admin/mensalistas" element={<EditMensalistas />}/>
        <Route path="/dashboard/admin/criadores" element={<EditCriadores />}/>
      </Routes>
    </GuildContext.Provider>
  );
}

export default Dashboard;
