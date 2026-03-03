import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './faces/HomePage';
import { MenuPage } from './faces/MenuPage';
import { CreatePollPage } from './faces/CreatePollPage';
import { ActivePollPage } from './faces/ActivePollPage';
import { EditDraftPage } from './faces/EditDraftPage';
import { SendDraftPage } from './faces/SendDraftPage';
import { CreateDraftPage } from './faces/CreateDraftPage';
import { GuildContext } from './utils/contexts/GuildContext';

function Dashboard() {

  const [guildId, setGuildId] = useState('11111');
  const updateGuildId = (id: string) => setGuildId(id);
  
  return (
    <GuildContext.Provider value={{guildId, updateGuildId,}}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/poll/active" element={<ActivePollPage />} />
        <Route path="/poll/create" element={<CreatePollPage />} />
        <Route path="/draft/create" element={<CreateDraftPage />}/>
        <Route path="/draft/edit" element={<EditDraftPage />}/>
        <Route path="/draft/send" element={<SendDraftPage />}/> 
      </Routes>
    </GuildContext.Provider>
  );
}

export default Dashboard;
