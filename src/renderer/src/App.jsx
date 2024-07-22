import { Route, Routes, Link } from "react-router-dom"
import HomePage from "./pages/HomePage"
import ProcessElementPage from "./pages/ProcessElementPage"
import LayoutPage from "./layout"

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route index element={<HomePage />} />
          <Route path="/process" element={<ProcessElementPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

