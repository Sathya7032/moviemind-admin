import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiFilm,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiHelpCircle,
  FiBarChart2,
  FiGrid,
} from "react-icons/fi";

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { path: "/dashboard/categories", icon: <FiGrid />, label: "Categories" },
    { path: "/dashboard/questions", icon: <FiHelpCircle />, label: "Questions" },
    { path: "/dashboard/movies", icon: <FiFilm />, label: "Movies" },
    { path: "/dashboard/users", icon: <FiUsers />, label: "Users" },
    { path: "/dashboard/analytics", icon: <FiBarChart2 />, label: "Analytics" },
    { path: "/dashboard/settings", icon: <FiSettings />, label: "Settings" },
    { path: "/dashboard/help", icon: <FiHelpCircle />, label: "Help" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={onClose}
        ></div>
      )}
      <aside
        className={`fixed top-0 left-0 w-[260px] h-screen bg-[#1e1e2d] text-[#a2a3b7] flex flex-col z-[100] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
            J
          </div>
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Javify Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium no-underline transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
                        : "text-[#a2a3b7] hover:bg-white/[0.06] hover:text-white"
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="text-lg flex items-center">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.07]">
          <button
            className="flex items-center gap-3 w-full px-4 py-3 border-none rounded-lg bg-red-500/10 text-red-500 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-red-500/20"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
