import { Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProcessElementPage from './pages/ProcessElementPage';
import LayoutPage from './layout';
import AdjustImagePage from './pages/AdjustImagePage';
import CredistsPage from './pages/CredistsPage';

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping');

  return (
    <>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route index element={<HomePage />} />
          <Route path="process" element={<ProcessElementPage />} />
          <Route path="adjust" element={<AdjustImagePage />} />
          <Route path="credits" element={<CredistsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
