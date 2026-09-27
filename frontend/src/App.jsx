import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ExploreEvents from './pages/ExploreEvents';
import EventDetails from './pages/EventDetails';
import MyEvents from './pages/MyEvents';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function PageShell({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-[60vh] pb-4"
    >
      {children}
    </motion.main>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageShell><Home /></PageShell>} />
        <Route path="/explore" element={<PageShell><ExploreEvents /></PageShell>} />
        <Route path="/events/:id" element={<PageShell><EventDetails /></PageShell>} />
        <Route path="/my-events" element={<PageShell><MyEvents /></PageShell>} />
        <Route path="/profile" element={<PageShell><Profile /></PageShell>} />
        <Route path="/login" element={<PageShell><Login /></PageShell>} />
        <Route path="/register" element={<PageShell><Register /></PageShell>} />
        <Route
          path="*"
          element={
            <PageShell>
              <div className="mx-auto w-full max-w-md px-4 pt-20 text-center">
                <h1 className="text-4xl font-extrabold text-brand-text">404</h1>
                <p className="mt-2 text-sm text-brand-secondary">Page not found. Let's get you back on track.</p>
                <a href="/" className="btn-primary mt-5 inline-flex">
                  Go Home
                </a>
              </div>
            </PageShell>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <ScrollToTop />
          <Navbar />
          <div className="flex-1">
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
