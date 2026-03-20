import { useState } from "react";
import Auth from "./components/Auth/Auth";
import Navbar from "./components/Navbar/Navbar";
import Timetable from "./components/Timetable/Timetable";
import Admin from "./components/Admin/Admin";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("timetable");

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setPage("timetable");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("timetable");
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar
        user={user}
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
      />
      {page === "timetable" && <Timetable user={user} />}
      {page === "admin" && user.role === "admin" && <Admin />}
      {page === "admin" && user.role !== "admin" && (
        <div className="unauthorized">
          <h2>Unauthorized</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      )}
    </div>
  );
}

App.propTypes = {};
