import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Questions from "./pages/Questions";
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
