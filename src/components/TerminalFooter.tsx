import { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

type HistoryLine = {
  type: 'command' | 'response' | 'error';
  content: string;
};

interface AdventureChoice {
  text: string;
  nextNode: string;
}

interface AdventureNode {
  text: string;
  choices: AdventureChoice[];
}

const ADVENTURE_STORY: Record<string, AdventureNode> = {
  start: {
    text: "🔒 Megacorp Mainframe Entrance. You have bypassed the external firewall. You see three entry points:\n[1] Physical access port in the basement server room\n[2] Optical fiber link on the rooftop antenna\n[3] Direct phishing attack on the CEO's assistant\nType '1', '2', or '3' to select your entry vector:",
    choices: [
      { text: "Basement vector selected. You slip past the loading dock.", nextNode: "basement" },
      { text: "Rooftop vector selected. You climb the fire escape with your node transceiver.", nextNode: "rooftop" },
      { text: "Phishing vector selected. You send an encrypted link disguised as an audit report.", nextNode: "phishing" }
    ]
  },
  basement: {
    text: "💾 Basement Server Room. A security guard is patrolling nearby. Do you:\n[1] Create a distraction by overloading the AC server rack cooling unit\n[2] Hide behind the high-density backup array cabinets\n[3] Hack the nearby terminal reader to lock the guard out\nType '1', '2', or '3':",
    choices: [
      { text: "AC unit overloaded! The guard leaves to investigate. You plug into the port.", nextNode: "success" },
      { text: "You hid behind the rack, but your custom cursor glow reflected on the floor. Caught!", nextNode: "fail" },
      { text: "Reader hacked! But it triggered a silent alarm. Lockdown engaged!", nextNode: "fail" }
    ]
  },
  rooftop: {
    text: "📡 Rooftop Antenna. A security drone begins mapping the rooftop. Do you:\n[1] Jam its sensors using your Flipper Zero\n[2] Disconnect and hide in the ventilation shaft\n[3] Attempt to hijack the drone's telemetry node\nType '1', '2', or '3':",
    choices: [
      { text: "Drone jammed! It spins off-course. You finish downloading files.", nextNode: "success" },
      { text: "Vent shaft entry. You escaped, but your connection equipment was seized.", nextNode: "fail" },
      { text: "Telemetry hijacked! You steer the drone away and extract the databases.", nextNode: "success" }
    ]
  },
  phishing: {
    text: "📧 Phishing Vector. The CEO's assistant opens the link, but security filters trigger a suspicious file warning. Do you:\n[1] Inject an obfuscated shell payload to bypass protection\n[2] Abort immediately and scrub connection logs\n[3] Call the assistant disguised as security IT support\nType '1', '2', or '3':",
    choices: [
      { text: "Payload injected! Security filters bypassed. Administrative access obtained.", nextNode: "success" },
      { text: "Scrubbed logs. Safe, but you gained no intelligence.", nextNode: "fail" },
      { text: "Disguise call worked! You talked them into verifying the OTP code. Shell active.", nextNode: "success" }
    ]
  },
  success: {
    text: "🎉 ACCESS GRANTED! You successfully downloaded the repository and logged out undetected. You are officially an Elite Netrunner. Type 'exit' to return to normal prompt.",
    choices: []
  },
  fail: {
    text: "🚨 SYSTEM LOCKED! Security caught you. Connection terminated. Type 'exit' to return to normal prompt, or 'try' to restart the hack.",
    choices: []
  }
};

function MatrixOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    
    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 360;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&+-=*/{}[]|<>'.split('');
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const rootStyle = getComputedStyle(document.documentElement);
    const accentColor = rootStyle.getPropertyValue('--accent').trim() || '#a1781b';

    const draw = () => {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = accentColor;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="px-4 py-2 border-b flex items-center justify-between text-xs select-none" style={{ borderColor: '#30363d', background: '#161b22', color: '#8b949e' }}>
        <span>Matrix Mode Active — Press ESC or click exit to close</span>
        <button onClick={onClose} className="hover:text-red-400 font-bold transition-colors">exit</button>
      </div>
      <canvas ref={canvasRef} className="flex-grow w-full" />
    </div>
  );
}

function SnakeOverlay({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let intervalId: any;
    
    const width = 400;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const gridSize = 10;
    const cols = width / gridSize;
    const rows = height / gridSize;

    let snake = [{ x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }];
    let dir = { x: 0, y: -1 };
    let food = { x: 15, y: 15 };
    let currentScore = 0;

    const generateFood = () => {
      let newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
      while (snake.some(s => s.x === newFood.x && s.y === newFood.y)) {
        newFood = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows)
        };
      }
      food = newFood;
    };

    const rootStyle = getComputedStyle(document.documentElement);
    const accentColor = rootStyle.getPropertyValue('--accent').trim() || '#a1781b';

    const gameLoop = () => {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        setGameOver(true);
        clearInterval(intervalId);
        return;
      }

      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        clearInterval(intervalId);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        currentScore += 10;
        setScore(currentScore);
        generateFood();
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, width, height);

      snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? accentColor : 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
      });

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    };

    intervalId = setInterval(gameLoop, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir.y !== 1) dir = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir.y !== -1) dir = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir.x !== 1) dir = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir.x !== -1) dir = { x: 1, y: 0 };
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, key]);

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setKey(prev => prev + 1);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="px-4 py-2 border-b flex items-center justify-between text-xs select-none" style={{ borderColor: '#30363d', background: '#161b22', color: '#8b949e' }}>
        <span>Snake Game — Score: <strong className="text-white">{score}</strong> (Controls: WASD / Arrows)</span>
        <button onClick={onClose} className="hover:text-red-400 font-bold transition-colors">exit</button>
      </div>
      <div className="flex-grow flex items-center justify-center relative p-4">
        <canvas ref={canvasRef} className="border shadow-lg bg-black" style={{ borderColor: '#30363d' }} />
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 z-20">
            <h4 className="text-red-400 text-xl font-bold mb-2">GAME OVER</h4>
            <p className="text-sm mb-4">Final Score: {score}</p>
            <div className="flex gap-4">
              <button onClick={restartGame} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90">Play Again</button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-transparent text-white border hover:bg-white/10" style={{ borderColor: '#30363d' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TerminalFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<'matrix' | 'snake' | 'guess' | 'adventure' | null>(null);
  
  // Custom game states
  const [guessTarget, setGuessTarget] = useState<number>(0);
  const [guessAttempts, setGuessAttempts] = useState<number>(0);
  const [adventureNode, setAdventureNode] = useState<string>('start');

  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'response', content: 'Welcome to EWC-OS v1.0.0' },
    { type: 'response', content: 'Type "help" to see available commands.' }
  ]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [history, isOpen]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    
    if (!cmd) return;

    // ── GAME MODE: GUESS THE NUMBER ──
    if (activeMode === 'guess') {
      const newHistory = [...history, { type: 'command' as const, content: input }];
      
      if (cmd === 'exit' || cmd === 'quit') {
        setActiveMode(null);
        newHistory.push({ type: 'response', content: 'Exited Guess game.' });
        setHistory(newHistory);
        setInput('');
        return;
      }

      const guessNum = parseInt(cmd);
      if (isNaN(guessNum)) {
        newHistory.push({ type: 'error', content: 'Please enter a valid number, or type "exit" to quit.' });
      } else {
        const newAttempts = guessAttempts + 1;
        setGuessAttempts(newAttempts);
        
        if (guessNum === guessTarget) {
          newHistory.push({ type: 'response', content: `🎉 CORRECT! You guessed the number ${guessTarget} in ${newAttempts} attempts!` });
          setActiveMode(null);
        } else {
          const hint = guessNum > guessTarget ? 'Too HIGH 👇' : 'Too LOW 👆';
          newHistory.push({ type: 'response', content: `${hint}. Try again (type "exit" to quit):` });
        }
      }
      setHistory(newHistory);
      setInput('');
      return;
    }

    // ── GAME MODE: CYBERPUNK ADVENTURE ──
    if (activeMode === 'adventure') {
      const newHistory = [...history, { type: 'command' as const, content: input }];
      
      if (cmd === 'exit' || cmd === 'quit') {
        setActiveMode(null);
        newHistory.push({ type: 'response', content: 'Exited Cyberpunk adventure.' });
        setHistory(newHistory);
        setInput('');
        return;
      }

      if (adventureNode === 'fail' && cmd === 'try') {
        setAdventureNode('start');
        newHistory.push({ type: 'response', content: 'Restarting Netrunner link...' });
        newHistory.push({ type: 'response', content: ADVENTURE_STORY['start'].text });
        setHistory(newHistory);
        setInput('');
        return;
      }

      const currentNode = ADVENTURE_STORY[adventureNode];
      const choiceIndex = parseInt(cmd) - 1;
      
      if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= currentNode.choices.length) {
        newHistory.push({ type: 'error', content: `Invalid option. Type '1', '2', or '3' (or 'exit' to quit).` });
      } else {
        const selectedChoice = currentNode.choices[choiceIndex];
        newHistory.push({ type: 'response', content: `> ${selectedChoice.text}` });
        
        const nextNodeKey = selectedChoice.nextNode;
        setAdventureNode(nextNodeKey);
        newHistory.push({ type: 'response', content: ADVENTURE_STORY[nextNodeKey].text });
      }
      
      setHistory(newHistory);
      setInput('');
      return;
    }

    // ── STANDARD CLI PARSER ──
    const newHistory = [...history, { type: 'command' as const, content: cmd }];
    
    switch (cmd) {
      case 'help':
        newHistory.push({ type: 'response', content: 'Available commands: about, skills, contact, resume, clear, cls, date, whoami, su, sudo su, matrix, hack, snake, guess, adventure' });
        break;
      case 'about':
        newHistory.push({ type: 'response', content: 'Erwin Wilson Ceniza | Principal Full-Stack Developer | Building commercial web applications and AI integrations.' });
        break;
      case 'skills':
        newHistory.push({ type: 'response', content: 'Frontend: React, TypeScript, Tailwind | Backend: C#, ASP.NET Core, Node.js | Database: SQL Server, PostgreSQL' });
        break;
      case 'contact':
        newHistory.push({ type: 'response', content: 'Email: erwinwilsonceniza@gmail.com | Phone: +63 935-122-8470' });
        break;
      case 'resume':
        newHistory.push({ type: 'response', content: 'Opening resume... (Please use the top navigation button to download the actual PDF)' });
        break;
      case 'whoami':
        newHistory.push({ type: 'response', content: isRoot ? 'root' : 'guest' });
        break;
      case 'date':
        newHistory.push({ type: 'response', content: new Date().toString() });
        break;
      case 'matrix':
        setHistory(newHistory);
        setInput('');
        setActiveMode('matrix');
        return;
      case 'snake':
      case 'game':
        setHistory(newHistory);
        setInput('');
        setActiveMode('snake');
        return;
      case 'guess':
        const target = Math.floor(Math.random() * 100) + 1;
        setGuessTarget(target);
        setGuessAttempts(0);
        setActiveMode('guess');
        newHistory.push({ type: 'response', content: '🔢 GUESS THE NUMBER! I am thinking of a number between 1 and 100.' });
        newHistory.push({ type: 'response', content: 'Enter your guess (type "exit" to quit):' });
        break;
      case 'adventure':
      case 'rpg':
        setAdventureNode('start');
        setActiveMode('adventure');
        newHistory.push({ type: 'response', content: '🕵️ CYBERPUNK TEXT ADVENTURE' });
        newHistory.push({ type: 'response', content: ADVENTURE_STORY['start'].text });
        break;
      case 'hack':
        newHistory.push({ type: 'response', content: 'Initializing cybernetic link...' });
        const hackSteps = [
          'Locating target system [IP: 192.168.42.109]...',
          'Bypassing SSL handshake protocols...',
          'Cracking 256-bit AES encryption keys...',
          'Injecting root payload into memory buffers...',
          'Gaining shell access: guest -> administrative root...',
          'Downloading top secret project files (98% completion)...',
          'SUCCESS: Access granted. System owned. Type "su" to toggle root shell permanently.'
        ];
        hackSteps.forEach((step, index) => {
          setTimeout(() => {
            setHistory(prev => [...prev, { type: 'response', content: step }]);
          }, (index + 1) * 300);
        });
        break;
      case 'sudo':
      case 'su':
      case 'sudo su':
        if (isRoot) {
          newHistory.push({ type: 'response', content: 'You are already root.' });
        } else {
          setIsRoot(true);
          newHistory.push({ type: 'response', content: 'Bypassing security protocols... Access granted. Welcome, root.' });
        }
        break;
      case 'exit':
        if (isRoot) {
          setIsRoot(false);
          newHistory.push({ type: 'response', content: 'Logged out of root.' });
        } else {
          setIsOpen(false);
        }
        break;
      case 'rm -rf /':
        if (isRoot) {
          setHistory([{ type: 'error', content: 'CRITICAL SYSTEM FAILURE: Root file system deleted.' }]);
          setTimeout(() => setIsOpen(false), 2000);
          return;
        } else {
          newHistory.push({ type: 'error', content: 'rm: cannot remove \'/\': Permission denied' });
        }
        break;
      case 'clear':
      case 'cls':
        setHistory([]);
        setInput('');
        return;
      case 'ls':
      case 'dir':
        newHistory.push({ type: 'response', content: 'projects/  skills/  experience/  contact/' });
        break;
      default:
        if (cmd.startsWith('echo ')) {
          newHistory.push({ type: 'response', content: cmd.replace('echo ', '') });
        } else {
          newHistory.push({ type: 'error', content: `Command not found: ${cmd}` });
        }
    }
    
    setHistory(newHistory);
    setInput('');
  };

  return (
    <>
      {/* Terminal Toggle Button in Footer */}
      {!isOpen && (
        <div className="flex justify-center pb-8" style={{ background: 'var(--bg-section)' }}>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono border transition-colors hover:opacity-80"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            <Terminal size={16} /> Open Terminal
          </button>
        </div>
      )}

      {/* Terminal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            drag={!isMaximized}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={{ top: -800, bottom: 50, left: -800, right: 800 }}
            className={`fixed left-1/2 -translate-x-1/2 z-[90] w-full max-w-4xl shadow-2xl overflow-hidden font-mono text-sm border ${
              isMaximized ? 'bottom-0 h-[80vh] rounded-t-xl' : 'bottom-4 h-[400px] rounded-xl w-[calc(100%-2rem)]'
            }`}
            style={{ 
              background: '#0d1117',
              borderColor: 'var(--border)' 
            }}
          >
            {/* Terminal Header */}
            <div 
              className="flex items-center justify-between px-4 py-2 border-b select-none cursor-move active:cursor-grabbing" 
              style={{ background: '#161b22', borderColor: '#30363d', touchAction: 'none' }}
              onPointerDown={(e) => {
                if (!isMaximized) dragControls.start(e);
              }}
            >
              <div className="flex items-center gap-2 text-xs" style={{ color: '#8b949e' }}>
                <Terminal size={14} /> EWC-OS Terminal
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="hover:text-white transition-colors"
                  style={{ color: '#8b949e' }}
                >
                  {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:text-red-400 transition-colors"
                  style={{ color: '#8b949e' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div 
              className="p-4 overflow-y-auto h-[calc(100%-40px)] relative"
              onClick={() => inputRef.current?.focus()}
            >
              {activeMode === 'matrix' && <MatrixOverlay onClose={() => setActiveMode(null)} />}
              {activeMode === 'snake' && <SnakeOverlay onClose={() => setActiveMode(null)} />}

              {history.map((line, i) => (
                <div key={i} className="mb-2">
                  {line.type === 'command' && (
                    <div className="flex items-start gap-2">
                      <span className={isRoot ? "text-red-400 font-bold" : "text-green-400"}>
                        {isRoot ? 'root@ewc-os:~#' : 'guest@ewc-os:~$'}
                      </span>
                      <span className="text-white">{line.content}</span>
                    </div>
                  )}
                  {line.type === 'response' && (
                    <div className="text-gray-300 ml-4 whitespace-pre-wrap">{line.content}</div>
                  )}
                  {line.type === 'error' && (
                    <div className="text-red-400 ml-4 font-bold">{line.content}</div>
                  )}
                </div>
              ))}
              
              <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
                <span className={isRoot ? "text-red-400 font-bold" : "text-green-400"}>
                  {isRoot ? 'root@ewc-os:~#' : 'guest@ewc-os:~$'}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`flex-1 bg-transparent border-none outline-none font-mono ${isRoot ? 'text-red-100' : 'text-white'}`}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
