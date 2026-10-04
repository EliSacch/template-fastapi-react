import { useSessionContext } from "../hooks/useSessionContext";

import SignInWithGoogleBtn from "../components/SignInWithGoogleBtn";

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
      {session.status === "signedOut" && <SignInWithGoogleBtn />}
      {session.status === "signedIn" && <p>Welcome, {session.email}!</p>}
    </main>
  );
}
