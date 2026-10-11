import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProcessElementPage from './pages/ProcessElementPage';
import LayoutPage from './layout';
import AdjustImagePage from './pages/AdjustImagePage';
import CreditsPage from './pages/CreditsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LayoutPage />}>
        <Route index element={<HomePage />} />
        <Route path="process" element={<ProcessElementPage />} />
        <Route path="adjust" element={<AdjustImagePage />} />
        <Route path="credits" element={<CreditsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
