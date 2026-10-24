import { BrowserRouter,Routes,Route } from "react-router-dom";
import Signup from "./pages/signup";
import Login from "./pages/login";
import Categories from "./pages/categories";

function App(){
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/signup" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/categories" element={<Categories/>}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App;