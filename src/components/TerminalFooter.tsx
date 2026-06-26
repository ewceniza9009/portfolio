import { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

type HistoryLine = {
  type: 'command' | 'response' | 'error';
  content: string;
};

export default function TerminalFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const [input, setInput] = useState('');
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

    const newHistory = [...history, { type: 'command' as const, content: cmd }];
    
    switch (cmd) {
      case 'help':
        newHistory.push({ type: 'response', content: 'Available commands: about, skills, contact, resume, clear, date, whoami, sudo su' });
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
        newHistory.push({ type: 'response', content: 'Downloading resume... (Please use the top navigation button to download the actual PDF)' });
        break;
      case 'whoami':
        newHistory.push({ type: 'response', content: isRoot ? 'root' : 'guest' });
        break;
      case 'date':
        newHistory.push({ type: 'response', content: new Date().toString() });
        break;
      case 'sudo':
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
              background: '#0d1117', // Classic GitHub dark theme terminal background
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
              className="p-4 overflow-y-auto h-[calc(100%-40px)]"
              onClick={() => inputRef.current?.focus()}
            >
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
                    <div className="text-gray-300 ml-4">{line.content}</div>
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
