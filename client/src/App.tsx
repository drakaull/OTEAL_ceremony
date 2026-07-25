import { Navigate, Route, Routes } from "react-router-dom";
import { GameProvider } from "./context/GameProvider";
import { LayoutWithNav } from "./components/LayoutWithNav";
import { MainScreen } from "./pages/MainScreen";
import { PlayView } from "./pages/PlayView";
import { AdminControl } from "./pages/AdminControl";
import { AdminSetup } from "./pages/AdminSetup";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/play" element={<PlayView />} />
        <Route element={<LayoutWithNav />}>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main" element={<MainScreen />} />
          <Route path="/admin/control" element={<AdminControl />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </GameProvider>
  );
}

export default App;
