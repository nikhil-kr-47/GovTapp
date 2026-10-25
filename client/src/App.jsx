import { BrowserRouter,Routes,Route } from "react-router-dom";
import Signup from "./pages/signup";
import Login from "./pages/login";
import Categories from "./pages/categories";
import Dashboard from "./pages/dashBoard";

function App(){
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/signup" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/categories" element={<Categories/>}></Route>
      <Route path="/dashboard" element={<Dashboard/>}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App;