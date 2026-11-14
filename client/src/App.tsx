import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OnboardingPage } from "./pages/OnboardingPage";

/** Route table for the whole app. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/app" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
