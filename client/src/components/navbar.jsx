import { Link,useNavigate,useLocation } from "react-router-dom";

function Navbar(){
    const navigate = useNavigate();
    useLocation();
    const token = localStorage.getItem("token");

    const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    };

    return (
    <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-md mb-6">
      {/* Brand / Logo */}
      <Link 
        to={token ? "/dashboard" : "/login"} 
        className="text-xl font-bold tracking-wide flex items-center gap-2 hover:text-blue-400 transition"
      >
        <span>🏛️</span>
        <span>GovTapp</span>
      </Link>
      {/* Nav Links */}
      <div className="flex items-center gap-6">
        {token ? (
          <>
            <Link 
              to="/dashboard" 
              className="text-slate-300 hover:text-white text-sm font-medium transition"
            >
              Dashboard
            </Link>
            <Link 
              to="/categories" 
              className="text-slate-300 hover:text-white text-sm font-medium transition"
            >
              Categories
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition shadow-sm"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-slate-300 hover:text-white text-sm font-medium transition"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition shadow-sm"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}


export default Navbar;