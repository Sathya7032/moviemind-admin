import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Questions from "./pages/Questions";
import Users from "./pages/Users";
import Leaderboard from "./pages/Leaderboard";
import Redeems from "./pages/Redeems";
import Analytics from "./pages/Analytics";
import DailyChallenge from "./pages/DailyChallenge";
import Rewards from "./pages/Rewards";
import Updates from "./pages/Updates";
import Banners from "./pages/Banners";
import DashboardLayout from "./components/DashboardLayout";
import Website from "./Website";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Website />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="questions" element={<Questions />} />
            <Route path="users" element={<Users />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="redeems" element={<Redeems />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="daily-challenges" element={<DailyChallenge />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="updates" element={<Updates />} />
            <Route path="banners" element={<Banners />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
