import googlePill from "../assets/signin-assets/Android + Web/SVG/Light/Theme=Light, Show text=Yes, Shape=Pill, Platform=Android+Web.svg";

const Home = () => {
    return (
        <main>
            <h1>Home</h1>
            <a className="continue" href="/auth/google">
                <img src={googlePill} alt="Sign in with Google" width={180} height={40} />
            </a>
        </main>
    );
};

export default Home;