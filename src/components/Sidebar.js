import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiUsers,
  FiLogOut,
  FiHelpCircle,
  FiBarChart2,
  FiGrid,
  FiTrendingUp,
  FiGift,
  FiAlertTriangle,
  FiX,
  FiZap,
  FiAward,
  FiBell,
  FiImage,
  FiTarget,
} from "react-icons/fi";

const LogoutModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="h-1.5 w-full bg-red-500" />
      <div className="p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
        >
          <FiX />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <FiAlertTriangle className="text-2xl text-red-500" />
        </div>

        <h2 className="text-lg font-bold text-gray-800">Confirm Logout</h2>
        <p className="mt-1 text-sm text-gray-500">
          Are you sure you want to log out of MovieMind Admin?
        </p>

        <div className="mt-6 flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-200 transition"
          >
            <FiLogOut /> Yes, Logout
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { path: "/dashboard/categories", icon: <FiGrid />, label: "Categories" },
    { path: "/dashboard/questions", icon: <FiHelpCircle />, label: "Questions" },
    { path: "/dashboard/users", icon: <FiUsers />, label: "Users" },
    { path: "/dashboard/leaderboard", icon: <FiTrendingUp />, label: "Leaderboard" },
    { path: "/dashboard/coin-battles", icon: <FiTarget />, label: "Coin Battles" },
    { path: "/dashboard/redeems", icon: <FiGift />, label: "Redeems" },
    { path: "/dashboard/rewards", icon: <FiAward />, label: "Rewards" },
    { path: "/dashboard/analytics", icon: <FiBarChart2 />, label: "Analytics" },
    { path: "/dashboard/daily-challenges", icon: <FiZap />, label: "Daily Challenges" },
    { path: "/dashboard/updates", icon: <FiBell />, label: "Updates" },
    { path: "/dashboard/banners", icon: <FiImage />, label: "Banners" },
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
        className={`fixed top-0 left-0 w-[260px] h-screen bg-[#1e1e2d] text-[#a2a3b7] flex flex-col z-[100] transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
            🎬
          </div>
          <span className="text-lg font-bold text-white whitespace-nowrap">
            MovieMind
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
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium no-underline transition-all duration-200 ${isActive
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
            onClick={() => setShowLogoutModal(true)}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
