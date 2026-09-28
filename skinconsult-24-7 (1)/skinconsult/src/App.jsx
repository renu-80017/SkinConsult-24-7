import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartupScreen from "./components/ui/StartupScreen";

import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Analyzer from "./pages/Analyzer";
import AIDoctor from "./pages/AIDoctor";
import Quiz from "./pages/Quiz";
import QuizResult from "./pages/QuizResult";
import Certificate from "./pages/Certificate";
import VerifyCertificate from "./pages/VerifyCertificate";
import Reports from "./pages/Reports";
import ReportViewer from "./pages/ReportViewer";
import Dashboard from "./pages/Dashboard";
import Models from "./pages/Models";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";

const HAS_SEEN_STARTUP_KEY = "sc-seen-startup";

export default function App() {
  const [showStartup, setShowStartup] = useState(
    () => !sessionStorage.getItem(HAS_SEEN_STARTUP_KEY)
  );

  const handleStartupDone = () => {
    sessionStorage.setItem(HAS_SEEN_STARTUP_KEY, "true");
    setShowStartup(false);
  };

  return (
    <BrowserRouter>
      {showStartup && <StartupScreen onDone={handleStartupDone} />}
      <Routes>
        <Route path="/" element={<About />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/ai-doctor" element={<AIDoctor />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/result" element={<QuizResult />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/verify-certificate" element={<VerifyCertificate />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportViewer />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/models" element={<Models />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
