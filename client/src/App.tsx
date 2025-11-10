import { useState, useEffect } from "react";

type AuthState = {
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
};

function App() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    loading: false,
    error: null,
  });

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
    setAuth({
      isAuthenticated: false,
      accessToken: null,
      loading: false,
      error: null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow flex items-center justify-center">
        {auth.loading ? (
          <div className="text-indigo-600 text-xl font-semibold animate-pulse">
            Redirecting...
          </div>
        ) : auth.isAuthenticated ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              Successfully Logged In!
            </h2>
            <div className="bg-gray-100 p-4 rounded mb-6 overflow-x-auto">
              <p className="text-gray-700 font-medium mb-2">Access Token:</p>
              <code className="text-sm break-all">{auth.accessToken}</code>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
            >
              Logout
            </button>
          </div>
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
