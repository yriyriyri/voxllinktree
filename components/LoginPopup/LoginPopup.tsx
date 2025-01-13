import React, {
  createRef,
  FormEvent,
  useEffect,
  useState,
} from "react";
// import "./LoginPopup.css";

const LoginPopup = () => {
  // Basic states to show typed input, purely cosmetic
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [animation, setAnimation] = useState(1);
  const [showVoxl, setShowVoxl] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showInitialOk, setShowInitialOk] = useState(false);

  // For the text "OK" indicators next to username/password
  const [showUsernameOk, setShowUsernameOk] = useState(false);
  const [showPasswordOk, setShowPasswordOk] = useState(false);

  // Refs to focus fields in sequence
  const inputUsernameRef = createRef<HTMLInputElement>();
  const inputPasswordRef = createRef<HTMLInputElement>();

  // Password field visibility
  const [showPasswordField, setShowPasswordField] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPasswordField(!showPasswordField);
  };

  // On mount, show the animations step by step
  useEffect(() => {
    // Show initial [OK] after 1.5s
    setTimeout(() => setShowInitialOk(true), 1500);

    // Show VOXL after 2.5 seconds
    setTimeout(() => {
      setShowVoxl(true);
    }, 2500);

    // Show login prompt after 4 seconds
    setTimeout(() => {
      setAnimation(2);
      setShowLoginForm(true);
    }, 4000);
  }, []);

  // Show [OK] if username has text
  useEffect(() => {
    setShowUsernameOk(username.length > 0);
  }, [username]);

  // Show [OK] if password has text
  useEffect(() => {
    setShowPasswordOk(password.length > 0);
  }, [password]);

  // Dummy submit to do nothing, purely cosmetic
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // No real authentication; just log it for fun
    console.log("Submitted:", { username, password });
  };

  return (
    <div className="login-popup-overlay">
      <div className="login-popup-content">
        {/* First "Initializing" line */}
        <div className="typewriter">
          <span
            className="text1"
            style={{ display: "flex" }}
            onAnimationEnd={() => setAnimation(2)}
          >
            {`> Initializing VOXL terminal...`}{" "}
            {showInitialOk && (
              <div className="voxl-login-ok"> [OK]</div>
            )}
          </span>
          {/* Cursor blink only shows during the first animation */}
          <span
            className="cursor"
            style={{ display: animation === 1 ? "" : "none" }}
          ></span>
        </div>

        {/* VOXL logo (only visible after a few seconds) */}
        <div
          className="typewriter"
          style={{ display: animation >= 2 ? "" : "none" }}
        >
          <span
            className="voxl-text"
            style={{
              display: showVoxl ? "block" : "none",
              marginBottom: 40,
              marginTop: 12,
            }}
          >
{` __      ______ __    _____      
 \\ \\    / / __  \\ \\ \\/ /| |     
  \\ \\  / / |  |  \\ \\  / | |     
   \\ \\/ /| |  | |/ /\\ \\ | |     
    \\  / | |__| / /__\\ \\| |____ 
     \\/   \\____/_/    \\_\\______|
`}
          </span>
        </div>

        {/* After the initial animations, show the login form */}
        <div
          className="typewriter"
          style={{ display: showLoginForm ? "block" : "none" }}
        >
          <span
            className="text2"
            onAnimationEnd={() => {
              setAnimation(3);
              inputUsernameRef.current?.focus();
            }}
          >
            <br />
            {`$ voxl.login start`}
          </span>
        </div>

        <div
          style={{
            opacity: showLoginForm ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", height: 20 }}>
              &gt;
              <input
                ref={inputUsernameRef}
                type="text"
                placeholder="username"
                style={{ marginTop: 18 }}
                value={username}
                maxLength={24}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    inputPasswordRef.current?.focus();
                  }
                }}
              />
              {showUsernameOk && <div className="voxl-login-ok">[OK]</div>}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 20,
                marginTop: 20,
              }}
            >
              &gt;
              <input
                ref={inputPasswordRef}
                type={showPasswordField ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginTop: 18 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(e);
                }}
              />
              {/* Toggle visibility icon */}
              <img
                src={
                  showPasswordField
                    ? "/images/icons/View.svg"
                    : "/images/icons/View_off.svg"
                }
                style={{
                  cursor: "pointer",
                  position: "relative",
                  marginRight: "10rem",
                }}
                alt="Toggle password visibility"
                onClick={togglePasswordVisibility}
              />
              {showPasswordOk && <div className="voxl-login-ok">[OK]</div>}
            </div>

            {/* "Login" button just logs to console */}
            <div style={{ marginTop: 20, color: "white", cursor: "pointer" }}>
              <div onClick={handleSubmit}>&gt; login</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;