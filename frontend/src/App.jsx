import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import RoleLanding from "./components/RoleLanding";
import AppLayout from "./components/AppLayout";
import { STAFF_ROLES } from "./utils/constants";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import Inventory from "./pages/Inventory";
import Requests from "./pages/Requests";
import Emergency from "./pages/Emergency";
import Hospitals from "./pages/Hospitals";
import Donations from "./pages/Donations";
import Analytics from "./pages/Analytics";
import CrisisPredictor from "./pages/CrisisPredictor";
import Leaderboard from "./pages/Leaderboard";
import Broadcast from "./pages/Broadcast";
import MyProfile from "./pages/MyProfile";
import DonorScanPage from "./pages/DonorScanPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/qr/:donorId" element={<DonorScanPage />} />
          <Route path="*" element={<NotFound />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleRoute roles={STAFF_ROLES}><RoleLanding /></RoleRoute>} />
            <Route path="/admin-portal" element={<RoleRoute roles={["admin"]}><Dashboard portal="admin" /></RoleRoute>} />
            <Route path="/hospital-portal" element={<RoleRoute roles={["hospital"]}><Dashboard portal="hospital" /></RoleRoute>} />
            <Route path="/my-profile" element={<RoleRoute roles={["donor"]}><MyProfile /></RoleRoute>} />
            <Route path="/donors" element={<RoleRoute roles={STAFF_ROLES}><Donors /></RoleRoute>} />
            <Route path="/inventory" element={<RoleRoute roles={STAFF_ROLES}><Inventory /></RoleRoute>} />
            <Route path="/requests" element={<RoleRoute roles={STAFF_ROLES}><Requests /></RoleRoute>} />
            <Route path="/emergency" element={<RoleRoute roles={STAFF_ROLES}><Emergency /></RoleRoute>} />
            <Route path="/hospitals" element={<RoleRoute roles={["admin", "hospital"]}><Hospitals /></RoleRoute>} />
            <Route path="/donations" element={<RoleRoute roles={STAFF_ROLES}><Donations /></RoleRoute>} />
            <Route path="/analytics" element={<RoleRoute roles={STAFF_ROLES}><Analytics /></RoleRoute>} />
            <Route path="/crisis" element={<RoleRoute roles={STAFF_ROLES}><CrisisPredictor /></RoleRoute>} />
            <Route path="/leaderboard" element={<RoleRoute roles={["admin", "hospital", "donor"]}><Leaderboard /></RoleRoute>} />
            <Route path="/broadcast" element={<RoleRoute roles={["admin", "hospital"]}><Broadcast /></RoleRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
