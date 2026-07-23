import { Navigate, Route, Routes } from "react-router-dom";
import { GameProvider } from "./context/GameProvider";
import { MainScreen } from "./pages/MainScreen";
import { PlayView } from "./pages/PlayView";
import { AdminControl } from "./pages/AdminControl";
import { AdminSetup } from "./pages/AdminSetup";

function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/play" replace />} />
        <Route path="/main" element={<MainScreen />} />
        <Route path="/play" element={<PlayView />} />
        <Route path="/admin/control" element={<AdminControl />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
      </Routes>
    </GameProvider>
  );
}

export default App;
