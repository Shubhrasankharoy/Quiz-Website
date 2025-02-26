import { Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import Login_page from './login_page'
import HomePage from "./Updated_home";
import Attempt_quiz from "./Attempt_quiz";
import ProtectedRoute from "./Protected_route";
import Profile from "./Profile";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Login_page />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/attempt_quiz/:quiz_id" element={<Attempt_quiz />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;
