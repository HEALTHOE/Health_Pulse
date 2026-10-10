import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Districts from "./pages/Districts";
import DistrictDetail from "./pages/DistrictDetail";
import Blocks from "./pages/Blocks";
import BlockDetail from "./pages/BlockDetail";
import FacilityDetail from "./pages/FacilityDetail";
import Indicators from "./pages/Indicators";
import Alerts from "./pages/Alerts";
import DataUpload from "./pages/DataUpload";
import DataQuality from "./pages/DataQuality";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected application routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/districts" element={<Districts />} />

          <Route
            path="/districts/:districtId"
            element={<DistrictDetail />}
          />

          <Route path="/blocks" element={<Blocks />} />

          <Route
            path="/blocks/:blockId"
            element={<BlockDetail />}
          />

          <Route
            path="/facilities/:facilityId"
            element={<FacilityDetail />}
          />

          <Route path="/indicators" element={<Indicators />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/data-upload" element={<DataUpload />} />
          <Route path="/data-quality" element={<DataQuality />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;