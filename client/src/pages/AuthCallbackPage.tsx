import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../lib/axios";

/**
 * This page is the redirect target after Google OAuth.
 * The server appends `?token=<jwt>` to the URL instead of setting a cookie.
 * We grab the token, persist it to localStorage, then navigate to /home.
 */
const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      navigate("/home", { replace: true });
    } else {
      // No token — something went wrong, send back to login
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-dark-bg">
      <div className="w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallbackPage;
