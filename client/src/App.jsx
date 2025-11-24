import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import GameMap from "./components/Map";
import Joystick from "./components/Joystick";
import Typewriter from "./components/Typewriter";
import capSprite from "./assets/cap.png";
import {
  CELL_SIZE,
  generateRandomMap,
  generateRandomEntities,
  ICON_INFO,
  TOTAL_ICONS,
} from "./constants";

import bgmFile from "./assets/sounds/bgm.mp3";
import stepFile from "./assets/sounds/step.mp3";
import popupFile from "./assets/sounds/popup.mp3";
import winFile from "./assets/sounds/win.mp3";
import lossFile from "./assets/sounds/loss.mp3";

function App() {
  // Initialize map and entities once
  const initialData = useMemo(() => {
    const newMap = generateRandomMap();
    const entities = generateRandomEntities(newMap);
    return { map: newMap, entities };
  }, []);

  const [mapMatrix, setMapMatrix] = useState(initialData.map);
  const [position, setPosition] = useState(initialData.entities.playerStart);
  const [direction, setDirection] = useState("down");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hearts, setHearts] = useState(3);
  const [shields, setShields] = useState(0);
  const [visitedIcons, setVisitedIcons] = useState(new Set());
  const [showTypewriter, setShowTypewriter] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const [pets, setPets] = useState(initialData.entities.pets);
  const [bugs, setBugs] = useState(initialData.entities.bugs);
  const [heartItems, setHeartItems] = useState(initialData.entities.hearts);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const bgmRef = useRef(new Audio(bgmFile));
  const stepRef = useRef(new Audio(stepFile));
  const popupRef = useRef(new Audio(popupFile));
  const winRef = useRef(new Audio(winFile));
  const lossRef = useRef(new Audio(lossFile));
  const lastCollisionRef = useRef({ pet: null, bug: null, heart: null });

  useEffect(() => {
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4;
    stepRef.current.volume = 0.6;
    return () => {
      bgmRef.current.pause();
    };
  }, []);

  const toggleAudio = () => {
    if (isMuted) {
      bgmRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      bgmRef.current.pause();
      setIsMuted(true);
    }
  };

  const playSfx = useCallback(
    (type) => {
      if (isMuted) return;
      if (type === "step") {
        const sound = stepRef.current.cloneNode();
        sound.volume = 0.3;
        sound.play();
      } else if (type === "popup") {
        popupRef.current.currentTime = 0;
        popupRef.current.play();
      }
    },
    [isMuted]
  );

  useEffect(() => {
    fetch("http://localhost:2408/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // Auto move entities
  useEffect(() => {
    const moveEntity = (entity) => {
      const { x, y } = entity;
      const directions = ["up", "down", "left", "right"];

      for (let i = 0; i < 10; i++) {
        const newDir =
          directions[Math.floor(Math.random() * directions.length)];
        let newX = x;
        let newY = y;

        if (newDir === "up") newY -= 1;
        else if (newDir === "down") newY += 1;
        else if (newDir === "left") newX -= 1;
        else if (newDir === "right") newX += 1;

        if (
          newY >= 0 &&
          newY < mapMatrix.length &&
          newX >= 0 &&
          newX < mapMatrix[0].length &&
          mapMatrix[newY][newX] !== 1
        ) {
          return { x: newX, y: newY, dir: newDir };
        }
      }
      return entity;
    };

    const interval = setInterval(() => {
      setPets((prev) => prev.map(moveEntity));
      setBugs((prev) => prev.map(moveEntity));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check collisions
  useEffect(() => {
    const checkCollisions = () => {
      // Check heart items collision
      for (const heart of heartItems) {
        const collisionKey = `${heart.x}-${heart.y}`;
        if (
          heart.x === position.x &&
          heart.y === position.y &&
          lastCollisionRef.current.heart !== collisionKey
        ) {
          lastCollisionRef.current.heart = collisionKey;
          playSfx("popup");
          queueMicrotask(() => {
            setHearts((prev) => Math.min(prev + 1, 5));
            setHeartItems((prev) => prev.filter((h) => h !== heart));
          });
          return;
        }
      }

      for (const pet of pets) {
        const collisionKey = `${pet.x}-${pet.y}`;
        if (
          pet.x === position.x &&
          pet.y === position.y &&
          shields === 0 &&
          lastCollisionRef.current.pet !== collisionKey
        ) {
          lastCollisionRef.current.pet = collisionKey;
          playSfx("popup");
          queueMicrotask(() => {
            setShields(1);
            setPets((prev) => prev.filter((p) => p !== pet));
          });
          return;
        }
      }

      for (const bug of bugs) {
        const collisionKey = `${bug.x}-${bug.y}`;
        if (
          bug.x === position.x &&
          bug.y === position.y &&
          lastCollisionRef.current.bug !== collisionKey
        ) {
          lastCollisionRef.current.bug = collisionKey;
          queueMicrotask(() => {
            if (shields > 0) {
              setShields(0);
            } else {
              setHearts((prev) => {
                const newHearts = prev - 1;
                if (newHearts <= 0) {
                  setTimeout(() => {
                    if (!isMuted) {
                      lossRef.current.volume = 0.5;
                      lossRef.current.play().catch(() => {});
                    }
                    setShowGameOver(true);
                  }, 500);
                }
                return Math.max(0, newHearts);
              });
            }
          });
          return;
        }
      }
    };

    checkCollisions();
  }, [position, pets, bugs, heartItems, shields, playSfx]);

  // Win condition
  useEffect(() => {
    if (visitedIcons.size === TOTAL_ICONS && hearts > 0) {
      setTimeout(() => {
        if (!isMuted) {
          winRef.current.volume = 0.5;
          winRef.current.play().catch(() => {});
        }
        setShowWin(true);
      }, 300);
    }
  }, [visitedIcons, hearts, isMuted]);

  const handleRestart = () => {
    const newMap = generateRandomMap();
    const entities = generateRandomEntities(newMap);
    setMapMatrix(newMap);
    setPosition(entities.playerStart);
    setHearts(3);
    setShields(0);
    setVisitedIcons(new Set());
    setPets(entities.pets);
    setBugs(entities.bugs);
    setHeartItems(entities.hearts);
    lastCollisionRef.current = { pet: null, bug: null, heart: null };
    setShowGameOver(false);
    setShowWin(false);
  };

  const moveCharacter = useCallback(
    (dir) => {
      if (showPopup) return;
      let newX = position.x;
      let newY = position.y;
      setDirection(dir);

      switch (dir) {
        case "up":
          newY -= 1;
          break;
        case "down":
          newY += 1;
          break;
        case "left":
          newX -= 1;
          break;
        case "right":
          newX += 1;
          break;
        default:
          return;
      }

      if (
        newY >= 0 &&
        newY < mapMatrix.length &&
        newX >= 0 &&
        newX < mapMatrix[0].length
      ) {
        const nextCell = mapMatrix[newY][newX];
        if (nextCell === 1) return;
        else if (nextCell >= 2 && nextCell <= 6) {
          playSfx("popup");
          const iconMap = {
            2: "whoami",
            3: "skills",
            4: "projects",
            5: "social",
            6: "contact",
          };
          setPopupType(iconMap[nextCell]);
          setShowPopup(true);
          setVisitedIcons((prev) => new Set([...prev, nextCell]));
        } else {
          playSfx("step");
          setPosition({ x: newX, y: newY });
        }
      }
    },
    [showPopup, position, playSfx, mapMatrix]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showPopup) {
        if (e.key === "Escape") {
          setShowPopup(false);
        }
        return;
      }
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          moveCharacter("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          moveCharacter("down");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          moveCharacter("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          moveCharacter("right");
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPopup, moveCharacter]);

  const renderPopupContent = () => {
    if (isLoading)
      return <p className="animate-pulse text-green-500">Connecting...</p>;
    if (!profile) return <p className="text-red-500">Error Loading Data</p>;

    switch (popupType) {
      case "whoami":
        return (
          <section>
            <p className="text-yellow-300 font-bold border-b border-gray-700 pb-1 mb-2">
              &gt; WHOAMI
            </p>
            <p className="pl-4 italic text-white/90">"{profile.bio}"</p>
          </section>
        );
      case "skills":
        return (
          <section>
            <p className="text-blue-400 font-bold border-b border-gray-700 pb-1 mb-2">
              &gt; SKILLS
            </p>
            <div className="flex flex-wrap gap-2 pl-4">
              {profile.skills.map((s, i) => (
                <span
                  key={`skill-${i}`}
                  className="bg-slate-800 text-green-300 px-3 py-1 rounded border border-green-900 text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        );
      case "projects":
        return (
          <section>
            <p className="text-red-400 font-bold border-b border-gray-700 pb-1 mb-2">
              &gt; PROJECTS
            </p>
            <div className="space-y-3 pl-4">
              {profile.projects.map((p, i) => (
                <div
                  key={`proj-${i}`}
                  className="group border-l-2 border-gray-600 pl-4"
                >
                  <h3 className="font-bold text-white text-lg">{p.name}</h3>
                  <p className="text-sm text-gray-400">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case "social":
        return (
          <section>
            <p className="text-purple-400 font-bold border-b border-gray-700 pb-1 mb-2">
              &gt; SOCIAL NETWORK
            </p>
            <div className="pl-4 text-sm space-y-2">
              <p>
                Github:{" "}
                <a
                  href={profile.socials?.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {profile.socials?.github}
                </a>
              </p>
            </div>
          </section>
        );
      case "contact":
        return (
          <section>
            <p className="text-cyan-400 font-bold border-b border-gray-700 pb-1 mb-2">
              &gt; CONTACT ME
            </p>
            <form
              onSubmit={handleContactSubmit}
              className="pl-4 text-sm space-y-3"
            >
              <div>
                <label className="block text-gray-400 mb-1">Name:</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800 border border-gray-600 rounded px-2 py-1 text-white focus:border-cyan-400 outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Email:</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800 border border-gray-600 rounded px-2 py-1 text-white focus:border-cyan-400 outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Message:</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full bg-slate-800 border border-gray-600 rounded px-2 py-1 text-white focus:border-cyan-400 outline-none resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 rounded transition-colors"
              >
                {isSending ? "Sending..." : "📧 Send Message"}
              </button>
              {sendStatus === "success" && (
                <p className="text-green-400 text-center">
                  ✅ Message sent successfully!
                </p>
              )}
              {sendStatus === "error" && (
                <p className="text-red-400 text-center">
                  ❌ Failed to send. Try again.
                </p>
              )}
            </form>
          </section>
        );
      default:
        return null;
    }
  };

  const downloadCV = () => {
    window.open("/cv.pdf", "_blank");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus(null);

    try {
      const response = await fetch("http://localhost:2408/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (data.success) {
        setSendStatus("success");
        setContactForm({ name: "", email: "", message: "" });
      } else {
        setSendStatus("error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSendStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-dvh w-screen bg-slate-900 flex flex-col items-center justify-evenly lg:justify-center font-mono text-white relative overflow-hidden">
      {/* Audio button */}
      <button
        onClick={toggleAudio}
        className="fixed top-4 right-4 z-[60] bg-slate-800/80 backdrop-blur border-2 border-yellow-500 p-2 rounded-full hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.5)] active:scale-95"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* Download CV button */}
      <button
        onClick={downloadCV}
        className="fixed top-4 left-4 z-[60] bg-slate-800/80 backdrop-blur border-2 border-green-500 px-4 py-2 rounded-full hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.5)] active:scale-95 text-sm font-bold"
      >
        📄 Download CV
      </button>

      {/* Hearts & Shields HUD */}
      <div className="fixed top-32 lg:top-20 right-4 z-[60] bg-slate-800/80 backdrop-blur border-2 border-red-500 px-3 py-2 rounded-lg">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={`heart-${i}`} className="text-xl">
              {i < hearts ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
        {shields > 0 && <div className="text-center text-xl mt-1">🛡️</div>}
      </div>

      {/* Icons Progress Tracker */}
      <div className="fixed top-32 lg:top-20 left-4 z-[60] bg-slate-800/80 backdrop-blur border-2 border-cyan-500 px-3 py-2 rounded-lg">
        <div className="text-xs text-cyan-300 mb-1 font-bold">
          Icons: {visitedIcons.size}/{TOTAL_ICONS}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(ICON_INFO).map(([key, info]) => (
            <div
              key={key}
              className={`text-base flex flex-col items-center ${
                visitedIcons.has(Number(key))
                  ? "opacity-100"
                  : "opacity-30 grayscale"
              }`}
              title={info.name}
            >
              <span>{info.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="flex-none mt-16 lg:mt-0 lg:mb-8 z-20 w-full text-center">
        <h1 className="text-2xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-[0.2em] drop-shadow-md relative animate-pulse-slow px-4 inline-block">
          CAP's Adventure
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-70 blur-sm"></div>
        </h1>
        {showTypewriter && (
          <div className="mt-4 text-sm lg:text-base text-cyan-300">
            <Typewriter
              text='Né bugs và khám phá hết các icons "thú vị" để win game'
              speed={50}
              onComplete={() =>
                setTimeout(() => setShowTypewriter(false), 3000)
              }
            />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full flex-1 flex items-center justify-center z-10 relative pointer-events-none lg:pointer-events-auto px-0 overflow-hidden">
        <div className="relative group shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full lg:w-auto transform scale-100 lg:scale-125 origin-center transition-transform duration-500 ease-out rounded-none lg:rounded-lg overflow-hidden border-0 lg:border-4 border-slate-700/50 pointer-events-auto">
          <GameMap mapMatrix={mapMatrix} />

          {/* Pets */}
          {pets.map((pet, idx) => (
            <div
              key={`pet-${idx}`}
              className="lg:hidden absolute transition-all duration-1000 ease-linear z-[15]"
              style={{
                width: `${100 / mapMatrix[0].length}%`,
                height: `${100 / mapMatrix.length}%`,
                top: `${(pet.y / mapMatrix.length) * 100}%`,
                left: `${(pet.x / mapMatrix[0].length) * 100}%`,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full">
                🐼
              </div>
            </div>
          ))}
          {pets.map((pet, idx) => (
            <div
              key={`pet-desk-${idx}`}
              className="hidden lg:block absolute transition-all duration-1000 ease-linear z-[15]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                top: pet.y * CELL_SIZE,
                left: pet.x * CELL_SIZE,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full">
                🐼
              </div>
            </div>
          ))}

          {/* Bugs */}
          {bugs.map((bug, idx) => (
            <div
              key={`bug-${idx}`}
              className="lg:hidden absolute transition-all duration-1000 ease-linear z-[15]"
              style={{
                width: `${100 / mapMatrix[0].length}%`,
                height: `${100 / mapMatrix.length}%`,
                top: `${(bug.y / mapMatrix.length) * 100}%`,
                left: `${(bug.x / mapMatrix[0].length) * 100}%`,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full animate-pulse">
                🐞
              </div>
            </div>
          ))}
          {bugs.map((bug, idx) => (
            <div
              key={`bug-desk-${idx}`}
              className="hidden lg:block absolute transition-all duration-1000 ease-linear z-[15]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                top: bug.y * CELL_SIZE,
                left: bug.x * CELL_SIZE,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full animate-pulse">
                🐞
              </div>
            </div>
          ))}

          {/* Heart Items */}
          {heartItems.map((heart, idx) => (
            <div
              key={`heart-${idx}`}
              className="lg:hidden absolute transition-all duration-300 ease-linear z-[15]"
              style={{
                width: `${100 / mapMatrix[0].length}%`,
                height: `${100 / mapMatrix.length}%`,
                top: `${(heart.y / mapMatrix.length) * 100}%`,
                left: `${(heart.x / mapMatrix[0].length) * 100}%`,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full animate-bounce">
                💖
              </div>
            </div>
          ))}
          {heartItems.map((heart, idx) => (
            <div
              key={`heart-desk-${idx}`}
              className="hidden lg:block absolute transition-all duration-300 ease-linear z-[15]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                top: heart.y * CELL_SIZE,
                left: heart.x * CELL_SIZE,
              }}
            >
              <div className="text-2xl flex items-center justify-center w-full h-full animate-bounce">
                💖
              </div>
            </div>
          ))}

          {/* Character Mobile */}
          <div
            className="lg:hidden absolute transition-all duration-200 ease-linear z-10"
            style={{
              width: `${100 / mapMatrix[0].length}%`,
              height: `${100 / mapMatrix.length}%`,
              top: `${(position.y / mapMatrix.length) * 100}%`,
              left: `${(position.x / mapMatrix[0].length) * 100}%`,
            }}
          >
            <img
              src={capSprite}
              alt="CAP"
              className="drop-shadow-md select-none"
              style={{
                position: "absolute",
                width: "80%",
                height: "80%",
                left: "50%",
                bottom: "0px",
                transform: `translateX(-50%) ${
                  direction === "left" ? "scaleX(-1)" : "scaleX(1)"
                }`,
                maxWidth: "none",
                zIndex: 20,
              }}
            />
          </div>
          {/* Character Desktop */}
          <div
            className="hidden lg:block absolute transition-all duration-200 ease-linear z-10"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              top: position.y * CELL_SIZE,
              left: position.x * CELL_SIZE,
            }}
          >
            <img
              src={capSprite}
              alt="CAP"
              className="drop-shadow-md select-none"
              style={{
                position: "absolute",
                width: "48px",
                height: "48px",
                left: "48%",
                bottom: "0px",
                transform: `translateX(-48%) ${
                  direction === "left" ? "scaleX(-1)" : "scaleX(1)"
                }`,
                maxWidth: "none",
                zIndex: 20,
              }}
            />
          </div>
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none mix-blend-overlay"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-none flex flex-col items-center gap-3 w-full z-20 pb-4 lg:pb-8 lg:mt-8">
        <div className="lg:hidden scale-90 flex justify-center w-full">
          <Joystick onMove={moveCharacter} />
        </div>

        <div className="flex flex-col gap-2 items-center w-full px-4">
          {/* PC Guide */}
          <div className="hidden lg:flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur px-6 py-2 rounded-full border border-blue-500/50 shadow-lg">
              <span className="text-2xl">⌨️</span>
              <span className="text-blue-300 font-bold text-base tracking-wide">
                Di chuyển bằng mũi tên hoặc WASD
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-400 bg-black/40 px-4 py-1 rounded-full">
              <span>🐼 Pet (+Shield)</span>
              <span>🐞 Bug (-Heart)</span>
            </div>
          </div>

          {/* Mobile Guide */}
          <div className="flex lg:hidden flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-slate-800/90 backdrop-blur px-3 py-0.5 rounded-full border border-green-500/50 shadow-lg w-max">
              <span className="text-base">👆</span>
              <span className="text-green-300 font-bold text-[10px] tracking-wide">
                Dùng nút ảo phía trên
              </span>
            </div>
            <div className="flex gap-2 text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded-full">
              <span>🐼 Pet</span>
              <span>🐞 Bug</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-green-500 rounded-lg max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl">
            <div className="bg-green-900/30 p-4 border-b border-green-500 flex justify-between">
              <h2 className="text-xl font-bold text-green-400 font-mono tracking-wider">
                💾 INFO
              </h2>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 border border-gray-600 px-3 rounded hover:bg-white hover:text-black"
              >
                ESC
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-gray-300 scrollbar-thin scrollbar-thumb-green-700">
              {renderPopupContent()}
            </div>
            <div className="p-3 border-t border-green-900 bg-slate-950 text-center">
              <button
                onClick={() => setShowPopup(false)}
                className="bg-green-700 hover:bg-green-600 text-white px-8 py-2 rounded font-bold shadow-lg"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[80] p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-br from-red-900 to-slate-900 border-4 border-red-500 rounded-2xl max-w-md w-full shadow-2xl animate-bounce-slow">
            <div className="p-8 text-center">
              <div className="text-8xl mb-4 animate-pulse">💀</div>
              <h2 className="text-4xl font-bold text-red-400 mb-4 font-mono tracking-wider">
                GAME OVER!
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Bạn đã hết tim! 🖤🖤🖤
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Icons đã khám phá: {visitedIcons.size}/{TOTAL_ICONS}
              </p>
              <button
                onClick={handleRestart}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
              >
                🔄 Chơi lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {showWin && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[80] p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-br from-yellow-500 via-green-500 to-blue-500 border-4 border-yellow-400 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-4xl font-bold text-white mb-4 font-mono tracking-wider drop-shadow-lg">
                VICTORY!
              </h2>
              <p className="text-xl text-white mb-6 font-bold">
                🎊 Chúc mừng bạn đã WIN! 🎊
              </p>
              <p className="text-lg text-white/90 mb-2">
                ✅ Đã khám phá hết {TOTAL_ICONS} icons!
              </p>
              <p className="text-lg text-white/90 mb-8">
                ❤️ Còn lại: {hearts} tim
              </p>
              <button
                onClick={handleRestart}
                className="bg-white hover:bg-gray-100 text-green-600 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
              >
                🔄 Chơi lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
