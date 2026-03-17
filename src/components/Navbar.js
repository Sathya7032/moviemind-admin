import { FiMenu, FiBell, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button
          className="hidden max-md:flex items-center justify-center w-9 h-9 border-none rounded-lg bg-gray-100 text-gray-700 text-xl cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={onToggleSidebar}
        >
          <FiMenu />
        </button>
        <div className="relative hidden md:flex items-center">
          <FiSearch className="absolute left-3 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Search movies, users..."
            className="w-80 py-2.5 pl-10 pr-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-red-500 focus:bg-white focus:ring-[3px] focus:ring-red-500/10 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative flex items-center justify-center w-10 h-10 border-none rounded-[10px] bg-gray-100 text-gray-700 text-lg cursor-pointer hover:bg-gray-200 transition-colors">
          <FiBell />
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center gap-2.5 py-1 pl-1 pr-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center text-sm font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[13px] font-semibold text-gray-800 leading-tight">
              {user?.fullName || "Admin"}
            </span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">
              {user?.role || "ADMIN"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
