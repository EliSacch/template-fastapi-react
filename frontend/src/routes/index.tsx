import { Route, Routes } from "react-router-dom";
import Home from "./Home.tsx";
import Profile from "./Profile.tsx";

export default function AppRoutes() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
  );
}
