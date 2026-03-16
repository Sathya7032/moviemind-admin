import { FiFilm, FiUsers, FiTrendingUp, FiAward } from "react-icons/fi";

const Dashboard = () => {
  const stats = [
    { label: "Total Movies", value: "1,248", icon: <FiFilm />, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Active Users", value: "8,492", icon: <FiUsers />, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Games Played", value: "34,567", icon: <FiTrendingUp />, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Avg Score", value: "72%", icon: <FiAward />, color: "text-red-500", bg: "bg-red-50" },
  ];

  const recentMovies = [
    { id: 1, title: "Inception", difficulty: "Hard", plays: 1240 },
    { id: 2, title: "The Dark Knight", difficulty: "Medium", plays: 2340 },
    { id: 3, title: "Interstellar", difficulty: "Hard", plays: 980 },
    { id: 4, title: "Pulp Fiction", difficulty: "Medium", plays: 1870 },
    { id: 5, title: "The Matrix", difficulty: "Easy", plays: 3210 },
  ];

  const topPlayers = [
    { rank: 1, name: "John Doe", score: 9850, games: 142 },
    { rank: 2, name: "Jane Smith", score: 9420, games: 138 },
    { rank: 3, name: "Mike Johnson", score: 9100, games: 125 },
    { rank: 4, name: "Sarah Lee", score: 8870, games: 119 },
    { rank: 5, name: "Alex Brown", score: 8650, games: 112 },
  ];

  const difficultyClasses = {
    Easy: "bg-green-100 text-green-800",
    Medium: "bg-amber-100 text-amber-800",
    Hard: "bg-red-100 text-red-800",
  };

  const rankClasses = {
    1: "bg-amber-100 text-amber-600",
    2: "bg-gray-200 text-gray-600",
    3: "bg-orange-100 text-orange-600",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to Javify Movie Guess Admin Panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shrink-0`}>
              {stat.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</span>
              <span className="text-xs text-gray-500 mt-0.5">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Movies */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Recent Movies</h3>
            <button className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition">View All</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Difficulty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Plays</th>
              </tr>
            </thead>
            <tbody>
              {recentMovies.map((movie) => (
                <tr key={movie.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-sm text-gray-700">{movie.title}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyClasses[movie.difficulty]}`}>
                      {movie.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{movie.plays.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Players */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Top Players</h3>
            <button className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition">View All</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Player</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Score</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Games</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((player) => (
                <tr key={player.rank} className="border-t border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${rankClasses[player.rank] || "bg-gray-100 text-gray-500"}`}>
                      {player.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{player.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{player.score.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{player.games}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
