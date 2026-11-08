import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Signup from "./pages/signup";
import Login from "./pages/login";
import Categories from "./pages/categories";
import Dashboard from "./pages/dashBoard";
import ProtectedRoute from "./components/protectedRoute";
import Navbar from "./components/navbar";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;