import { Navigate } from "react-router-dom";
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  // 🚪 No token? Kick the user to /login!
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // ✅ Token exists? Let them see the protected page!
  return children;
}
export default ProtectedRoute;