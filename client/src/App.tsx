import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ManagerDashboard from './pages/ManagerDashboard';
import EventsPage from './pages/EventsPage';
import InterestedEventsPage from './pages/InterestedEventsPage';
import SchedulePage from './pages/SchedulePage';
import EventChatPage from './pages/EventChatPage';
import MessagePage from './pages/MessagePage';
import DirectionsPage from './pages/DirectionsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/interested-events" element={<ProtectedRoute><InterestedEventsPage /></ProtectedRoute>} />
            <Route path="/events/:eventId/chat" element={<ProtectedRoute><EventChatPage /></ProtectedRoute>} />
            <Route path="/directions/:venueId?" element={<ProtectedRoute><DirectionsPage /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/message-page" element={<ProtectedRoute><MessagePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
