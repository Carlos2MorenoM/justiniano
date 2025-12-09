import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ChatInterface } from './components/ChatInterface';
import { SdkGenerator } from './components/SdkGenerator';

/**
 * Root Application Component.
 * Implements the Routing Strategy using the DashboardLayout template.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout Wrapper */}
        <Route path="/" element={<DashboardLayout />}>

          {/* Default Route: Chat */}
          <Route index element={<ChatInterface />} />

          {/* New Feature: Developers / SDK Generator */}
          <Route path="developers" element={<SdkGenerator />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;