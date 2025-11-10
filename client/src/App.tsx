import { useState, useEffect } from "react";
import Profile from "./components/Profile";

type AuthState = {
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
};

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    // Initialize state from localStorage if available
    const storedAuth = localStorage.getItem('auth');
    return storedAuth 
      ? JSON.parse(storedAuth) 
      : {
          isAuthenticated: false,
          accessToken: null,
          loading: false,
          error: null,
        };
  });

  // Persist auth state to localStorage
  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(auth));
  }, [auth]);

  // Check for access_token in URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");

    if (accessToken) {
      setAuth({
        isAuthenticated: true,
        accessToken,
        loading: false,
        error: null,
      });

      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    // Redirect user to backend login endpoint
    window.location.href = "http://localhost:4000/login";
  };

  const handleLogout = () => {
    // Clear auth state and localStorage
    localStorage.removeItem('auth');
    setAuth({
      isAuthenticated: false,
      accessToken: null,
      loading: false,
      error: null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow flex items-center justify-center p-4">
        {auth.loading ? (
          <div className="text-indigo-600 text-xl font-semibold animate-pulse">
            Redirecting...
          </div>
        ) : auth.isAuthenticated && auth.accessToken ? (
          <Profile accessToken={auth.accessToken} onLogout={handleLogout} />
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6">Login with Fyers</h2>
            <button
              onClick={handleLogin}
              disabled={auth.loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded transition duration-200 disabled:opacity-50"
            >
              {auth.loading ? "Redirecting..." : "Login with Fyers"}
            </button>
            {auth.error && <p className="mt-4 text-red-500">{auth.error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
