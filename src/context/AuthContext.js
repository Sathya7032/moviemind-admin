import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const email = localStorage.getItem("email");
    const fullName = localStorage.getItem("fullName");
    const role = localStorage.getItem("role");

    if (accessToken && email && role === "ADMIN") {
      setUser({ email, fullName, role });
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    localStorage.setItem("accessToken", authData.accessToken);
    localStorage.setItem("refreshToken", authData.refreshToken);
    localStorage.setItem("email", authData.email);
    localStorage.setItem("fullName", authData.fullName);
    localStorage.setItem("role", authData.role);
    setUser({
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    localStorage.removeItem("fullName");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
