import googlePill from "../assets/signin-assets/Android + Web/SVG/Light/Theme=Light, Show text=Yes, Shape=Pill, Platform=Android+Web.svg";
import { useSessionContext } from "../hooks/useSessionContext";

export default function Home() {
  const session = useSessionContext();

  if (session.status === "loading") {
    return (
      <main>
        <p>Checking your session…</p>
      </main>
    );
  }

  if (session.status === "error") {
    return (
      <main>
        <p role="alert">{session.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Home</h1>
      {session.status === "signedOut" && (
        <a className="continue" href="/auth/google">
          <img src={googlePill} alt="Sign in with Google" width={180} height={40} />
        </a>
      )}{" "}
      {session.status === "signedIn" && <p>Welcome, {session.email}!</p>}
    </main>
  );
}
