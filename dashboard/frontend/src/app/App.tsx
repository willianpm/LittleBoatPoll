import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { useViewportHeight } from './lib/useViewportHeight';

export default function App() {
  useViewportHeight();

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
