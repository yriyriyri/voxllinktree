import React, { createRef, FormEvent, useEffect, useState, useRef } from "react";
// import "./LoginPopup.css";

interface LoginPopupProps {
  onComplete?: () => void;
}

const generateRandomHex = (length: number): string => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/~`-=';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const LoginPopup: React.FC<LoginPopupProps> = ({ onComplete }) => {
  useEffect(() => {
    console.log("LoginPopup mounted");
    return () => console.log("LoginPopup unmounted");
  }, []);

  const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null);
  const canceledRef = useRef(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [animation, setAnimation] = useState(1);
  const [showVoxl, setShowVoxl] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showInitialOk, setShowInitialOk] = useState(false);
  const [showUsernameOk, setShowUsernameOk] = useState(false);
  const [showPasswordOk, setShowPasswordOk] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  const inputUsernameRef = createRef<HTMLInputElement>();
  const inputPasswordRef = createRef<HTMLInputElement>();

  const [showPasswordField, setShowPasswordField] = useState(false);
  const togglePasswordVisibility = () => setShowPasswordField((prev) => !prev);

  const [typewriterFinished, setTypewriterFinished] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowInitialOk(true), 1500);
    setTimeout(() => setShowVoxl(true), 2500);
    setTimeout(() => {
      setAnimation(2);
      setShowLoginForm(true);
    }, 4000);
  }, []);

  useEffect(() => {
    setShowUsernameOk(username.length > 0);
  }, [username]);

  useEffect(() => {
    setShowPasswordOk(password.length > 0);
  }, [password]);

  useEffect(() => {
    if (!showLoginForm) return;
  
    const delayTimeout = setTimeout(() => {
      const fullUsername = generateRandomHex(8);
      const fullPassword = generateRandomHex(20);
  
      let userIndex = 0;
      let passIndex = 0;
  
      const typingInterval = setInterval(() => {
        if (userIndex <= fullUsername.length) {
          setUsername(fullUsername.slice(0, userIndex));
          userIndex++;
        } else if (userIndex > fullUsername.length && passIndex === 0) {
          setTimeout(() => {
            passIndex = 1; 
          }, 500); 
        } else if (passIndex > 0 && passIndex <= fullPassword.length) {
          setPassword(fullPassword.slice(0, passIndex));
          passIndex++;
        }
  
        if (userIndex > fullUsername.length && passIndex > fullPassword.length) {
          clearInterval(typingInterval);
          setTimeout(() => {
            setTypewriterFinished(true);
            setShowLoadingBar(true);
          }, 500);
        }
      }, 40);
  
      return () => {
        clearInterval(typingInterval);
        clearTimeout(delayTimeout);
      };
    }, 750);
  
    return () => clearTimeout(delayTimeout);
  }, [showLoginForm]);

  const loadingSteps = [
    { bar: "[------------------------------]", label: "[00]", color: "#ff0000" },
    { bar: "[===---------------------------]", label: "[10]", color: "#ff0000" },
    { bar: "[======------------------------]", label: "[20]", color: "#ffa700" },
    { bar: "[=========---------------------]", label: "[30]", color: "#ffa700" },
    { bar: "[============------------------]", label: "[40]", color: "#fff400" },
    { bar: "[===============---------------]", label: "[50]", color: "#fff400" },
    { bar: "[==================------------]", label: "[60]", color: "#a3ff00" },
    { bar: "[=====================---------]", label: "[70]", color: "#a3ff00" },
    { bar: "[========================------]", label: "[80]", color: "#4AF626" },
    { bar: "[===========================---]", label: "[90]", color: "#4AF626" },
    { bar: "[==============================]", label: "[OK]", color: "#4AF626" },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!typewriterFinished) return;
    console.log("Typewriter finished, starting loading steps");

    canceledRef.current = false;

    const updateStep = () => {
      setCurrentStep((prev) => {
        if (canceledRef.current) {
          return prev;
        }

        if (prev >= loadingSteps.length - 1) {
          console.log("loading completed, invoking onComplete");
          if (!canceledRef.current) {
            if (timeoutHandleRef.current) clearTimeout(timeoutHandleRef.current);
            setTimeout(() => {
              if (!canceledRef.current && onComplete) onComplete();
            }, 50);
          }
          return prev;
        }

        const nextDelay = Math.random() * 500 + 50;
        timeoutHandleRef.current = setTimeout(updateStep, nextDelay);
        return prev + 1;
      });
    };

    updateStep();

    return () => {
      canceledRef.current = true;
      if (timeoutHandleRef.current) {
        clearTimeout(timeoutHandleRef.current);
      }
    };
  }, [typewriterFinished, onComplete, loadingSteps.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", { username, password });
  };

  return (
    <div className="login-popup-overlay">
      <div className="login-popup-content">
        <div className="typewriter">
          <span
            className="text1"
            style={{ display: "flex" }}
            onAnimationEnd={() => setAnimation(2)}
          >
            {`> Initializing VOXL terminal...`}{" "}
            {showInitialOk && <div className="voxl-login-ok"> [OK]</div>}
          </span>
          <span className="cursor" style={{ display: animation === 1 ? "" : "none" }}></span>
        </div>

        <div className="typewriter" style={{ display: animation >= 2 ? "" : "none" }}>
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

        <div className="typewriter" style={{ display: showLoginForm ? "block" : "none" }}>
          <span
            className="text2"
            style={{ marginLeft: "20px" }}
            onAnimationEnd={() => {
              setAnimation(3);
              inputUsernameRef.current?.focus();
            }}
          >
            <br />
            {`$ voxl.autologin start`}
          </span>
        </div>

        <div
          style={{
            opacity: showLoginForm ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", height: 20, marginLeft:"40px" }}>
              &gt;
              <input
                ref={inputUsernameRef}
                type="text"
                placeholder="username"
                style={{ marginTop: 18 }}
                value={username}
                readOnly
              />
              {showUsernameOk && (
                <div className="voxl-login-ok" style={{ marginRight: "40px" }}>
                  [OK]
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", height: 20, marginTop: 20, marginLeft:"40px" }}>
              &gt;
              <input
                ref={inputPasswordRef}
                type={showPasswordField ? "text" : "password"}
                placeholder="password"
                value={password}
                style={{ marginTop: 18 }}
                readOnly
              />
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
              {showPasswordOk && (
                <div className="voxl-login-ok" style={{ marginRight: "40px" }}>
                  [OK]
                </div>
              )}
            </div>

            {showLoadingBar && loadingSteps[currentStep] && (
              <div
                className="fade-in"
                style={{
                  marginTop: 50,
                  textAlign: "left",
                  color: "white",
                }}
              >
                <div>
                  {loadingSteps[currentStep].bar}{" "}
                  <span
                    className="voxl-login-ok"
                    style={{ color: loadingSteps[currentStep].color }}
                  >
                    {loadingSteps[currentStep].label}
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;