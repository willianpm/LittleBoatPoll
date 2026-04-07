import { createBrowserRouter } from 'react-router';
import { AuthShell } from './components/AuthShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Overview } from './pages/Overview';
import { ActivePolls } from './pages/ActivePolls';
import { CreatePoll } from './pages/CreatePoll';
import { PollHistory } from './pages/PollHistory';
import { PollDetail } from './pages/PollDetail';
import { Moderation } from './pages/Moderation';
import { PollDrafts } from './pages/PollDrafts';
import { PollCSV } from './pages/PollCSV';
import { Login } from './pages/Login';

export const router = createBrowserRouter([
  {
    Component: AuthShell,
    children: [
      { path: '/login', Component: Login },
      {
        Component: ProtectedRoute,
        children: [
          {
            path: '/',
            Component: DashboardLayout,
            children: [
              { index: true, Component: Overview },
              { path: 'active', Component: ActivePolls },
              { path: 'create', Component: CreatePoll },
              { path: 'drafts', Component: PollDrafts },
              { path: 'csv', Component: PollCSV },
              { path: 'moderation', Component: Moderation },
              { path: 'history', Component: PollHistory },
              { path: 'poll/:id', Component: PollDetail },
            ],
          },
        ],
      },
    ],
  },
]);
