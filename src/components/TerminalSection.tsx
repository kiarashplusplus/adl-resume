import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Terminal, Sparkles, Copy, Check, Monitor, Code2, ChevronRight } from "lucide-react"
import { isMCPMode, enableMCPMode, disableMCPMode } from "@/mcp/useMCP"
import { useIsMobile } from "@/hooks/use-mobile"

interface CommandOutput {
  command: string
  output: string[]
  isError?: boolean
  isMCP?: boolean
  showCopyButton?: boolean
}

const commands: Record<string, string[]> = {
  help: [
    "Available Commands",
    "",
    "  about       Learn about Kiarash",
    "  skills      View technical skills",
    "  projects    List featured projects",
    "  contact     Get contact information",
    "  resume      Download resume (PDF)",
    "  book        Schedule a call",
    "  experience  View work history",
    "  guestbook   Sign the guestbook",
    "  whoami      Identity and profile info",
    "  mcp         Toggle MCP mode for AI agents",
    "  mcp connect How to connect AI assistants",
    "  clear       Clear terminal",
    "  help        Show this help message",
    "",
    "Tip: Try 'mcp connect' to connect AI assistants"
  ],
  about: [
    "KIARASH ADL",
    "Senior Software Engineer",
    "Full-Stack AI Systems Architect",
    "",
    "Education: MIT EECS '14",
    "Experience: 10+ Years",
    "",
    "Building end-to-end AI platforms, agentic systems,",
    "and scalable cloud architectures.",
    "",
    "Focus Areas:",
    "  • AI/ML Systems",
    "  • Computer Vision", 
    "  • Full-Stack Development"
  ],
  skills: [
    "Technical Expertise",
    "",
    "Languages",
    "  Python         ●●●●●●●●●○  95%",
    "  TypeScript     ●●●●●●●●●○  90%",
    "  C++/CUDA       ●●●●●●●○○○  75%",
    "",
    "AI & Machine Learning",
    "  Deep Learning      Expert",
    "  Computer Vision    Expert",
    "  NLP/LLMs           Expert",
    "  MLOps              Advanced"
  ],
  "skills --ai": [
    "AI/ML Deep Dive",
    "",
    "Transformers & LLMs",
    "  • Custom architectures, fine-tuning, RAG",
    "  • Production LLM orchestration",
    "",
    "Computer Vision",
    "  • Object detection, segmentation",
    "  • Patent-pending AI solutions",
    "",
    "GPU Optimization",
    "  • CUDA kernel development",
    "  • 55x speedup achievement (ICASSP 2012)",
    "",
    "Production ML",
    "  • Model serving at scale"
  ],
  projects: [
    "Featured Projects",
    "",
    "1. Bayan (trybayan.com)",
    "   Bilingual Farsi-English Persian poetry analysis",
    "   13,828 poems | 33,640 dictionary entries | 106,037 verses",
    "   Tech: Swift, SwiftUI, CoreData, NLP",
    "",
    "2. Financial Intelligence Meta-Layer (FIML)",
    "   AI-native MCP server",
    "   32K+ LOC, 1,403 tests, 100% pass rate",
    "   Tech: Python, MCP, AI Orchestration",
    "",
    "3. Aligna (www.align-a.com)",
    "   Conversational AI Recruiter",
    "   Voice interviews via LiveKit",
    "   Tech: Next.js, Azure OpenAI, Docker",
    "",
    "4. Undisk MCP (mcp.undisk.app)",
    "   Undo-first versioned file workspace for AI agents",
    "   25 MCP tools | <50ms restore | immutable writes",
    "   Tech: MCP, Cloudflare Workers, Durable Objects",
    "",
    "Tip: Try 'projects --latest' for current work"
  ],
  "projects --latest": [
    "Current Focus (2024-2025)",
    "",
    "Bayan iOS App (trybayan.com)",
    "  Bilingual Farsi-English Persian poetry analysis",
    "  13,828 poems across 12 poets, 20 collections",
    "  Status: Live",
    "",
    "AI Vision (Founder & CEO)",
    "  Patent-pending AI and computer vision",
    "  solutions for home services",
    "  Progress: 80% - App Store Live",
    "",
    "FIML Open Source",
    "  Phase 2 development in progress",
    "  Progress: 60% - Active Development",
    "",
    "Undisk MCP (mcp.undisk.app)",
    "  Undo-first file memory for AI agents",
    "  Status: Live"
  ],
  contact: [
    "Contact Information",
    "",
    "Email: kiarasha@alum.mit.edu",
    "Phone: +1-857-928-1608",
    "",
    "LinkedIn: linkedin.com/in/kiarashadl",
    "GitHub: github.com/kiarashplusplus",
    "",
    "Schedule: calendly.com/kiarasha-alum/30min",
    "",
    "Open to: AI roles, consulting, collaboration",
    "",
    "Tip: Type 'book' to open scheduling page"
  ],
  book: [
    "Schedule a Call",
    "",
    "Book a free 30-minute call with Kiarash:",
    "calendly.com/kiarasha-alum/30min",
    "",
    "Topics we can discuss:",
    "  • AI/ML projects and architecture",
    "  • Technical consulting",
    "  • Collaboration opportunities",
    "  • Your next big idea",
    "",
    "Opening Calendly in new tab..."
  ],
  guestbook: [
    "Guestbook",
    "",
    "Leave a message for future visitors!",
    "",
    "How to sign:",
    "  1. Scroll down to find the guestbook section",
    "  2. Click 'Sign Guestbook'",
    "  3. Pick an emoji, write a message",
    "  4. Your entry will appear after review",
    "",
    "Be the first to sign!"
  ],
  resume: [
    "Resume - Kiarash Adl",
    "",
    "Download PDF:",
    "  https://25x.codes/assets/Kiarash-Adl-Resume-20251129-DFXsl4HJ.pdf",
    "",
    "Summary:",
    "  Senior Software Engineer & AI Systems Architect",
    "  MIT EECS '14 | 10+ Years Experience",
    "",
    "Highlights:",
    "  • AI Vision (Founder & CEO) - Patent-pending AI solutions",
    "  • Google - Search Knowledge Panel & Knowledge Graph",
    "  • 500K+ lines of production code shipped",
    "  • Published researcher (ICASSP 2012)",
    "",
    "Opening resume in new tab..."
  ],
  experience: [
    "Work History",
    "",
    "2024-Present",
    "  AI Vision (Founder & CEO)",
    "  AI solutions for home services",
    "",
    "2019-2024",
    "  Technical Consulting",
    "  MVPs, architecture, AI systems",
    "",
    "2018-2019",
    "  Monir (Founder & CEO)",
    "  Personalized shopping AI, VC funded",
    "",
    "2014-2018",
    "  Google (Software Engineer)",
    "  Search Knowledge Panel, Knowledge Graph",
    "",
    "2014",
    "  Twitter Ads (SWE Intern)",
    "  ML for audience expansion"
  ],
  whoami: [
    "Identity",
    "",
    "User: senior-engineer",
    "Group: mit-alum",
    "Roles: ai-ml, full-stack, leadership",
    "",
    "Profile",
    "",
    "EXPERTISE: AI/ML, Full-Stack, Computer Vision",
    "EDUCATION: MIT EECS 2014",
    "PASSION: Building things that matter"
  ],
  neofetch: [
    "        .--.        kiarash@portfolio",
    "       |o_o |       ",
    "       |:_/ |       OS: SeniorEngineer v10.0",
    "      //   \\ \\      Host: MIT EECS '14",
    "     (|     | )     Kernel: AI/ML-optimized",
    "    /'\\_   _/`\\     Shell: TypeScript/Python",
    "    \\___)=(___/     Uptime: 10+ years experience",
    "                    DE: Full-Stack Architecture",
    "                    WM: Agile/Leadership",
    "                    CPU: Problem-solving @ 100%",
    "                    GPU: CUDA-enabled (55x speedup)",
    "                    Memory: 500K+ LOC shipped"
  ],
  // ═══════════════════════════════════════════════════════════════════
  // SECRET COMMANDS - The rabbit hole goes deeper...
  // ═══════════════════════════════════════════════════════════════════
  matrix: [
    "⠀⠀⠀⢀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣶⣤⡀⠀⠀⠀",
    "⠀⢀⣾⣿⡿⠛⠉⠉⠉⠉⠉⠉⠛⢿⣿⣷⡀⠀",
    "⠀⣾⣿⠋⠀⠀⠀ WAKE UP ⠀⠀⠀⠋⣿⣷⠀",
    "⢸⣿⡇⠀⠀⠀⠀ NEO... ⠀⠀⠀⠀⢸⣿⡇",
    "⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇",
    "⠀⣿⣷⠀⠀ The Matrix has you. ⠀⣾⣿⠀",
    "⠀⠸⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⠇⠀",
    "⠀⠀⠙⢿⣿⣶⣤⣤⣤⣤⣤⣤⣶⣿⡿⠋⠀⠀",
    "",
    "Follow the white rabbit. 🐰",
    "",
    "Hint: Try 'rabbit' or press ↑↑↓↓←→←→ anywhere"
  ],
  rabbit: [
    "     /)  /)",
    "   =(• •)=   You found me!",
    "    (  \" )   ",
    "",
    "🐰 The White Rabbit says:",
    "",
    "\"Curious visitors deserve curious rewards.\"",
    "",
    "Hidden commands unlocked:",
    "  • sudo      - Try it...",
    "  • hack      - 1337 mode",
    "  • coffee    - Essential fuel",
    "  • 42        - The answer",
    "  • fortune   - Words of wisdom",
    "  • secrets   - What else is hidden?",
    "",
    "The deeper you go, the more you find..."
  ],
  sudo: [
    "Password: ********",
    "",
    "Verifying... ✓",
    "",
    "⚠️  ROOT ACCESS GRANTED ⚠️",
    "",
    "Just kidding. Nice try though! 😄",
    "",
    "But since you tried...",
    "Here's a real secret: Type 'hack' for 1337 mode"
  ],
  "sudo rm -rf /": [
    "☠️  DELETING EVERYTHING...",
    "",
    "   [████████████████████] 100%",
    "",
    "Just kidding! This isn't a real terminal 😅",
    "",
    "But I appreciate your sense of humor.",
    "Type 'fortune' for some wisdom."
  ],
  hack: [
    "┌──────────────────────────────────────────┐",
    "│  ENTERING 1337 H4CK3R M0D3...           │",
    "│                                          │",
    "│  > Bypassing mainframe... ✓              │",
    "│  > Decrypting Gibson... ✓                │",
    "│  > Hacking the planet... ✓               │",
    "│                                          │",
    "│  ACCESS GRANTED                          │",
    "│                                          │",
    "│  \"Mess with the best,                    │",
    "│   die like the rest.\"                    │",
    "│                         - Hackers (1995) │",
    "└──────────────────────────────────────────┘",
    "",
    "Achievement Unlocked: 🏆 ZERO COOL",
    "",
    "More to find: Try 'coffee', '42', or 'xyzzy'"
  ],
  coffee: [
    "              ))))",
    "             ((((  ",
    "           +======+",
    "           |      |]",
    "           \\      / ",
    "            `----'  ",
    "",
    "☕ BREWING PERFECT CODE...",
    "",
    "Coffee Stats:",
    "  Daily intake:     ████████░░  ~4 cups",
    "  Code quality:     ████████████  Excellent",
    "  Debug efficiency: ████████████  Maximum",
    "",
    "\"A programmer is a machine that turns",
    " coffee into code.\"",
    "",
    "Fun fact: This portfolio was built with",
    "approximately 47 cups of coffee."
  ],
  "42": [
    "🌌 DEEP THOUGHT COMPUTING...",
    "",
    "   Processing for 7.5 million years...",
    "",
    "The Answer to the Ultimate Question",
    "of Life, the Universe, and Everything:",
    "",
    "              ╔═══════════╗",
    "              ║    42     ║",
    "              ╚═══════════╝",
    "",
    "\"I think the problem, to be quite honest",
    " with you, is that you've never actually",
    " known what the question is.\"",
    "",
    "             - Deep Thought",
    "",
    "🚀 Don't Panic. And always carry a towel."
  ],
  fortune: [
    "🔮 CONSULTING THE ORACLE...",
    "",
    getRandomFortune(),
    "",
    "Type 'fortune' again for another wisdom."
  ],
  secrets: [
    "🔐 SECRET REGISTRY",
    "",
    "Found so far:",
    "  [?] matrix     - Wake up...",
    "  [?] rabbit     - Follow the white rabbit",
    "  [?] sudo       - Nice try",
    "  [?] hack       - 1337 mode",
    "  [?] coffee     - Essential fuel",
    "  [?] 42         - The answer",
    "  [?] fortune    - Random wisdom",
    "  [?] xyzzy      - Magic word",
    "  [?] love       - What drives us",
    "  [?] time       - When was this built?",
    "  [?] ping       - Are you there?",
    "  [?] cowsay     - Moo",
    "",
    "Still hidden:",
    "  [█] ????       - Find the Konami code",
    "  [█] ????       - What's in a name?",
    "  [█] ????       - The ultimate command",
    "",
    "\"Not all those who wander are lost.\"",
    "              - J.R.R. Tolkien"
  ],
  xyzzy: [
    "✨ A hollow voice says \"PLUGH\".",
    "",
    "You are in a twisty maze of little",
    "passages, all alike.",
    "",
    "   > GO NORTH",
    "   You are in a twisty maze of little",
    "   passages, all alike.",
    "",
    "   > XYZZY",
    "   Nothing happens.",
    "",
    "Wait... something IS happening!",
    "",
    "🏆 Achievement Unlocked: COLOSSAL CAVE",
    "",
    "(A nod to the original 1977 text adventure)",
    "Type 'plugh' for the response..."
  ],
  plugh: [
    "A hollow voice says \"XYZZY\".",
    "",
    "You've found the secret passage!",
    "The ancient magic of Adventure lives on.",
    "",
    "\"It is pitch black. You are likely",
    " to be eaten by a grue.\"",
    "",
    "🕯️ But you have the light of curiosity."
  ],
  love: [
    "💖 LOVE.exe",
    "",
    "What I love about engineering:",
    "",
    "  • Solving impossible problems",
    "  • Building things from nothing",
    "  • That moment when tests pass",
    "  • Clean, elegant code",
    "  • Teaching and mentoring",
    "  • Late night breakthroughs",
    "  • The developer community",
    "",
    "\"The best engineers aren't just good",
    " at coding. They're good at caring.\"",
    "",
    "Thanks for caring enough to explore. ❤️"
  ],
  time: [
    "⏰ TEMPORAL COORDINATES",
    "",
    `  Build Date:  December 2025`,
    `  Framework:   Preact + TypeScript`,
    `  Build Time:  ~4.8 seconds`,
    `  LOC:         ~15,000`,
    "",
    "Development Timeline:",
    "  Day 1:   \"This will be quick\"",
    "  Day 3:   \"Just one more feature\"",
    "  Day 7:   \"Perfect is the enemy of good\"",
    "  Day 14:  \"Ship it!\"",
    "",
    "Time spent on easter eggs: Too much 🐰"
  ],
  ping: [
    "PING portfolio.25x.codes",
    "",
    "  64 bytes: seq=1 ttl=64 time=0.042ms",
    "  64 bytes: seq=2 ttl=64 time=0.038ms",
    "  64 bytes: seq=3 ttl=64 time=0.041ms",
    "  64 bytes: seq=4 ttl=64 time=0.039ms",
    "",
    "--- ping statistics ---",
    "4 packets transmitted, 4 received, 0% loss",
    "",
    "✅ I'm here! Thanks for checking.",
    "",
    "PONG! 🏓"
  ],
  cowsay: [
    " _______________________________________",
    "< Moo! You found me! I'm a hidden cow. >",
    " ---------------------------------------",
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
    "",
    "🐄 Achievement Unlocked: BOVINE DISCOVERY",
    "",
    "Try: cowsay hello world"
  ],
  kiarash: [
    "کیارش",
    "",
    "Name Meaning:",
    "  From Persian: کیارش (Kiārash)",
    "  \"King\" + \"Arrow\" = \"King's Arrow\"",
    "",
    "  Also: Heroic prince in Shahnameh,",
    "  Ferdowsi's epic Persian poem.",
    "",
    "  In the legend, Arash the Archer shot",
    "  an arrow to mark Iran's borders.",
    "  It flew from dawn to dusk.",
    "",
    "Fun fact: Those Persian characters in",
    "the Matrix rain? That's the Persian",
    "alphabet - my heritage in code. 🇮🇷",
    "",
    "🏆 Achievement: ETYMOLOGY EXPLORER"
  ],
  "": [] // Empty command
}

// Fortune messages for the fortune command
function getRandomFortune(): string {
  const fortunes = [
    "\"Any sufficiently advanced technology is\n indistinguishable from magic.\"\n              - Arthur C. Clarke",
    "\"Talk is cheap. Show me the code.\"\n              - Linus Torvalds",
    "\"First, solve the problem. Then,\n write the code.\"\n              - John Johnson",
    "\"Code is like humor. When you have\n to explain it, it's bad.\"\n              - Cory House",
    "\"Simplicity is the soul of efficiency.\"\n              - Austin Freeman",
    "\"Before software can be reusable it\n first has to be usable.\"\n              - Ralph Johnson",
    "\"Make it work, make it right,\n make it fast.\"\n              - Kent Beck",
    "\"The best error message is the one\n that never shows up.\"\n              - Thomas Fuchs",
    "\"Programs must be written for people\n to read, and only incidentally for\n machines to execute.\"\n              - Abelson & Sussman",
    "\"Debugging is twice as hard as writing\n the code. So if you write code as\n cleverly as possible, you're not smart\n enough to debug it.\"\n              - Brian Kernighan"
  ]
  return fortunes[Math.floor(Math.random() * fortunes.length)]
}

export function TerminalSection() {
  const isMobile = useIsMobile()
  
  // Early return for mobile - no terminal state/logic loaded
  if (isMobile) {
    return <MobileTerminalPlaceholder />
  }
  
  return <DesktopTerminal />
}

// Lightweight mobile placeholder component
function MobileTerminalPlaceholder() {
  return (
    <section aria-labelledby="terminal-section-heading" itemScope itemType="https://schema.org/WebApplication">
      <TerminalSEOContent />
      <Card flat className="p-0 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
            </div>
            <Terminal className="h-4 w-4 text-zinc-500 ml-2" aria-hidden="true" />
            <span className="text-xs text-zinc-500 font-mono">terminal</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Static Terminal Icon - no infinite animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-60" />
              <div className="relative bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/50 backdrop-blur-sm">
                <Code2 className="h-12 w-12 text-green-400" />
              </div>
            </div>
          </div>
          
          {/* Message */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-zinc-100">
              Interactive Terminal
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Experience a fully interactive zsh terminal with commands like{" "}
              <code className="text-green-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">about</code>,{" "}
              <code className="text-green-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">skills</code>, and{" "}
              <code className="text-green-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">projects</code>
            </p>
          </div>
          
          {/* Desktop CTA */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 rounded-xl border border-zinc-700/50">
              <Monitor className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-zinc-300">Open on desktop for the full experience</span>
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </div>
          </div>
          
          {/* Static Terminal Preview */}
          <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs border border-zinc-800/50">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
              <span className="text-green-400">kiarash@portfolio</span>
              <span>:</span>
              <span className="text-blue-400">~</span>
              <span>$</span>
              <span className="text-zinc-300 ml-1">neofetch</span>
            </div>
            <div className="text-zinc-500 text-[10px] leading-relaxed">
              <div>OS: SeniorEngineer v10.0</div>
              <div>Host: MIT EECS '14</div>
              <div>Shell: TypeScript/Python</div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800/50 text-xs text-zinc-600 font-mono text-center">
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-violet-500/50" />
            WebMCP enabled • AI agents welcome
          </span>
        </div>
      </Card>
    </section>
  )
}

// SEO content shared between mobile and desktop
function TerminalSEOContent() {
  return (
    <div className="sr-only">
      <h2 id="terminal-section-heading">Interactive Portfolio Terminal</h2>
      <meta itemProp="name" content="Kiarash Adl Portfolio Terminal" />
      <meta itemProp="applicationCategory" content="Portfolio" />
      
      <section aria-label="About Kiarash Adl">
        <h3>About</h3>
        <p>Kiarash Adl - Senior Software Engineer and Full-Stack AI Systems Architect. MIT EECS 2014 graduate with 10+ years experience building end-to-end AI platforms, agentic systems, and scalable cloud architectures. Focus areas: AI/ML, Computer Vision, Full-Stack Development.</p>
      </section>
      
      <section aria-label="Technical Skills">
        <h3>Skills</h3>
        <ul role="list">
          <li>Python: 95% proficiency - Primary language for AI/ML and backend</li>
          <li>TypeScript: 90% proficiency - Full-stack web development</li>
          <li>C++/CUDA: 75% proficiency - GPU programming, 55x speedup achievement</li>
          <li>Deep Learning: Expert level</li>
          <li>Computer Vision: Expert level</li>
          <li>NLP/LLMs: Expert level</li>
          <li>MLOps: Advanced level</li>
        </ul>
      </section>
      
      <section aria-label="Featured Projects">
        <h3>Projects</h3>
        <ul role="list">
          <li>Bayan (trybayan.com): Bilingual Farsi-English classical Persian poetry analysis. 13,828 poems, 33,640 dictionary entries, 106,037 searchable verses. Tech: Swift, SwiftUI, CoreData, NLP.</li>
          <li>Financial Intelligence Meta-Layer (FIML): AI-native MCP server, 32K+ LOC, 1,403 tests, 100% pass rate. Tech: Python, MCP, AI Orchestration.</li>
          <li>Aligna (align-a.com): Conversational AI Recruiter with voice interviews via LiveKit. Tech: Next.js, Azure OpenAI, Docker.</li>
          <li>Undisk MCP (mcp.undisk.app): Undo-first versioned file workspace for AI agents with immutable writes, surgical restore, and tamper-evident audit trail. Tech: MCP, Cloudflare Workers, Durable Objects.</li>
        </ul>
      </section>
      
      <section aria-label="Contact Information">
        <h3>Contact</h3>
        <ul role="list">
          <li>Email: kiarasha@alum.mit.edu</li>
          <li>Phone: +1-857-928-1608</li>
          <li>LinkedIn: linkedin.com/in/kiarashadl</li>
          <li>GitHub: github.com/kiarashplusplus</li>
          <li>Schedule a call: calendly.com/kiarasha-alum/30min</li>
        </ul>
      </section>
      
      <section aria-label="Work Experience">
        <h3>Experience</h3>
        <ul role="list">
          <li>2024-Present: AI Vision (Founder & CEO) - AI solutions for home services</li>
          <li>2019-2024: Technical Consulting - MVPs, architecture, AI systems</li>
          <li>2018-2019: Monir (Founder & CEO) - Personalized shopping AI, VC funded</li>
          <li>2014-2018: Google (Software Engineer) - Search Knowledge Panel, Knowledge Graph</li>
          <li>2014: Twitter Ads (SWE Intern) - ML for audience expansion</li>
        </ul>
      </section>
    </div>
  )
}

// Full desktop terminal with all functionality
function DesktopTerminal() {
  const [history, setHistory] = useState<CommandOutput[]>([
    { command: "", output: ["Welcome to Kiarash's Portfolio Terminal", "Type 'resume' or 'help' for available commands.", ""] }
  ])
  const [currentInput, setCurrentInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [mcpEnabled, setMcpEnabled] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  
  // Example curl command for copy button
  const curlExample = `curl -X POST https://25x.codes/mcp/invoke \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"run_terminal_command","input":{"command":"about"}}'`
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }
  
  // Check MCP mode on mount
  useEffect(() => {
    setMcpEnabled(isMCPMode())
  }, [])
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])
  
  // MCP tool caller
  const callMCPTool = useCallback(async (name: string, input: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    if (typeof navigator !== "undefined" && navigator.modelContext) {
      try {
        return await navigator.modelContext.callTool(name, input)
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
      }
    }
    return { success: false, error: "MCP not available" }
  }, [])
  
  const processCommand = async (input: string) => {
    const trimmedInput = input.trim().toLowerCase()
    
    if (trimmedInput === "clear") {
      setHistory([])
      return
    }
    
    // MCP connection info
    if (trimmedInput === "mcp connect" || trimmedInput === "mcp info") {
      setHistory(prev => [...prev, {
        command: input,
        output: [
          "WEBMCP - AI AGENT API",
          "",
          "This portfolio implements the WebMCP standard, allowing AI agents",
          "to discover and call tools programmatically.",
          "",
          "Discovery (signed manifest):",
          "  https://25x.codes/.well-known/mcp.llmfeed.json",
          "",
          "API Endpoint:",
          "  POST https://25x.codes/mcp/invoke",
          "",
          "Available Tools:",
          "  • get_project_details  Get project info (bayan, fiml, aligna, aivision, undisk)",
          "  • run_terminal_command Run: about, skills, projects, contact, experience",
          "",
          "Example:",
          '  curl -X POST https://25x.codes/mcp/invoke \\',
          '    -H "Content-Type: application/json" \\',
          '    -d \'{"tool":"run_terminal_command","input":{"command":"about"}}\'',
          ""
        ],
        isMCP: true,
        showCopyButton: true
      }])
      if (trimmedInput) {
        setCommandHistory(prev => [...prev, trimmedInput])
      }
      setHistoryIndex(-1)
      return
    }
    
    // MCP mode toggle
    if (trimmedInput === "mcp" || trimmedInput === "mcp on" || trimmedInput === "mcp off") {
      const shouldEnable = trimmedInput === "mcp on" || (trimmedInput === "mcp" && !mcpEnabled)
      if (shouldEnable) {
        enableMCPMode()
        setMcpEnabled(true)
        setHistory(prev => [...prev, {
          command: input,
          output: [
            "🤖 MCP Mode: ENABLED",
            "",
            "AI agents can now discover and call tools on this site.",
            "Tools available: get_project_details, run_terminal_command",
            "",
            "Commands in MCP mode will also trigger tool calls.",
            "Type 'mcp off' to disable.",
            ""
          ],
          isMCP: true
        }])
      } else {
        disableMCPMode()
        setMcpEnabled(false)
        setHistory(prev => [...prev, {
          command: input,
          output: ["🔒 MCP Mode: DISABLED", ""],
          isMCP: true
        }])
      }
      if (trimmedInput) {
        setCommandHistory(prev => [...prev, trimmedInput])
      }
      setHistoryIndex(-1)
      return
    }
    
    // MCP status check
    if (trimmedInput === "mcp status") {
      const toolCount = navigator.modelContext?.tools?.length ?? 0
      setHistory(prev => [...prev, {
        command: input,
        output: [
          `MCP Status: ${mcpEnabled ? "ENABLED" : "DISABLED"}`,
          `Tools registered: ${toolCount}`,
          `Discovery: /.well-known/mcp.llmfeed.json`,
          ""
        ],
        isMCP: true
      }])
      if (trimmedInput) {
        setCommandHistory(prev => [...prev, trimmedInput])
      }
      setHistoryIndex(-1)
      return
    }
    
    // Special handling for 'book' command - open Calendly
    if (trimmedInput === "book" || trimmedInput === "schedule" || trimmedInput === "calendly") {
      window.open("https://calendly.com/kiarasha-alum/30min", "_blank", "noopener,noreferrer")
    }
    
    // Special handling for 'resume' command - open resume PDF
    if (trimmedInput === "resume" || trimmedInput === "cv") {
      window.open("/assets/Kiarash-Adl-Resume-20251129-DFXsl4HJ.pdf", "_blank", "noopener,noreferrer")
    }
    
    let output: string[]
    let isError = false
    let isMCP = false
    
    // Dynamic cowsay command
    if (trimmedInput.startsWith("cowsay ")) {
      const message = input.trim().substring(7) || "Moo!"
      const maxLen = Math.min(message.length, 40)
      const border = "_".repeat(maxLen + 2)
      const borderBottom = "-".repeat(maxLen + 2)
      output = [
        ` ${border}`,
        `< ${message.padEnd(maxLen)} >`,
        ` ${borderBottom}`,
        "        \\   ^__^",
        "         \\  (oo)\\_______",
        "            (__)\\       )\\/\\",
        "                ||----w |",
        "                ||     ||",
        ""
      ]
      setHistory(prev => [...prev, { command: input, output, isError, isMCP }])
      if (trimmedInput) setCommandHistory(prev => [...prev, trimmedInput])
      setHistoryIndex(-1)
      return
    }
    
    // Dynamic fortune - always regenerate
    if (trimmedInput === "fortune") {
      output = [
        "🔮 CONSULTING THE ORACLE...",
        "",
        getRandomFortune(),
        "",
        "Type 'fortune' again for another wisdom."
      ]
      setHistory(prev => [...prev, { command: input, output, isError, isMCP }])
      if (trimmedInput) setCommandHistory(prev => [...prev, trimmedInput])
      setHistoryIndex(-1)
      return
    }
    
    // If MCP mode is enabled, try calling MCP tools for supported commands
    const mcpCommands = ["about", "skills", "projects", "contact", "experience", "help"]
    if (mcpEnabled && mcpCommands.includes(trimmedInput)) {
      const result = await callMCPTool("run_terminal_command", { command: trimmedInput })
      if (result.success && result.data) {
        const data = result.data as { output: string }
        // Split the output into lines and add MCP indicator
        output = [
          "✨ [MCP Response]",
          "",
          ...data.output.split("\n"),
          ""
        ]
        isMCP = true
      } else {
        // Fallback to regular command
        output = commands[trimmedInput] || [`zsh: command not found: ${input}`, "Type 'help' for available commands."]
      }
    } else if (trimmedInput === "") {
      output = [""]
    } else if (trimmedInput === "schedule" || trimmedInput === "calendly") {
      // Alias commands for book
      output = commands["book"]
    } else if (commands[trimmedInput]) {
      output = commands[trimmedInput]
    } else {
      output = [`zsh: command not found: ${input}`, "Type 'help' for available commands."]
      isError = true
    }
    
    setHistory(prev => [...prev, { command: input, output, isError, isMCP }])
    
    if (trimmedInput) {
      setCommandHistory(prev => [...prev, trimmedInput])
    }
    setHistoryIndex(-1)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand(currentInput)
      setCurrentInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "")
      } else {
        setHistoryIndex(-1)
        setCurrentInput("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Simple tab completion
      const matches = Object.keys(commands).filter(cmd => cmd.startsWith(currentInput.toLowerCase()))
      if (matches.length === 1) {
        setCurrentInput(matches[0])
      }
    }
  }
  
  return (
    <section aria-labelledby="terminal-section-heading" itemScope itemType="https://schema.org/WebApplication">
      <TerminalSEOContent />
      <Card flat className="p-0 overflow-hidden" role="application" aria-label="Interactive terminal emulator">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Terminal window controls (decorative)">
            <div className="w-3 h-3 rounded-full bg-red-500/80" aria-hidden="true"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" aria-hidden="true"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80" aria-hidden="true"></div>
          </div>
          <Terminal className="h-4 w-4 text-zinc-400 ml-2" aria-hidden="true" />
          <span className="text-xs text-zinc-400 font-mono">kiarash@portfolio — zsh</span>
        </div>
        <div className="flex items-center gap-2">
          {mcpEnabled && (
            <span className="flex items-center gap-1 text-xs text-violet-400 font-mono" aria-label="MCP mode enabled">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              MCP
            </span>
          )}
          <span className="text-xs text-zinc-500 font-mono" aria-hidden="true">bash</span>
        </div>
      </div>
      
      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        onClick={(e) => {
          // Don't focus input if user is selecting text or clicking a button
          const selection = window.getSelection()
          if (selection && selection.toString().length > 0) return
          const target = e.target as HTMLElement
          if (target.tagName === 'BUTTON' || target.closest('button')) return
          inputRef.current?.focus()
        }}
        className="bg-zinc-950 p-4 h-[400px] overflow-y-auto font-mono text-sm cursor-text"
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
      >
        <AnimatePresence>
          {history.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
            >
              {item.command && (
                <div className="flex items-center gap-2 text-zinc-100">
                  <span className="text-green-400">kiarash@portfolio</span>
                  <span className="text-zinc-500">:</span>
                  <span className="text-blue-400">~</span>
                  <span className="text-zinc-500">$</span>
                  <span>{item.command}</span>
                  {item.isMCP && <Sparkles className="h-3 w-3 text-violet-400 ml-1" aria-hidden="true" />}
                </div>
              )}
              {item.output.map((line, lineIndex) => (
                <div 
                  key={lineIndex} 
                  className={`whitespace-pre select-text ${item.isError ? "text-red-400" : item.isMCP ? "text-violet-300" : "text-zinc-300"}`}
                >
                  {line || "\u00A0"}
                </div>
              ))}
              {/* Copy button for MCP connect command */}
              {item.showCopyButton && (
                <div className="mt-3 bg-zinc-900 rounded-lg p-3 border border-zinc-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">
                      Try it now
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(curlExample, index)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-md transition-colors font-medium"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy Config
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-green-300 text-xs bg-black/50 p-2 rounded overflow-x-auto select-all font-mono">
                    {curlExample}
                  </pre>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Current Input Line */}
        <div className="flex items-center gap-2 text-zinc-100">
          <span className="text-green-400" aria-hidden="true">kiarash@portfolio</span>
          <span className="text-zinc-500" aria-hidden="true">:</span>
          <span className="text-blue-400" aria-hidden="true">~</span>
          <span className="text-zinc-500" aria-hidden="true">$</span>
          <label htmlFor="terminal-input" className="sr-only">Enter terminal command</label>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-zinc-100 caret-zinc-100"
            spellcheck={false}
            autoComplete="off"
            aria-label="Terminal command input. Type help for available commands."
          />
        </div>
      </div>
      
      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500 font-mono flex items-center justify-between">
        <div>
          <span>↑↓ History</span>
          <span className="mx-3">|</span>
          <span>Mens et Manus</span>
          <span className="mx-3">|</span>
          <span>Try: neofetch, whoami</span>
        </div>
        <div className="flex items-center gap-2">
          {mcpEnabled ? (
            <span className="text-violet-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Mode
            </span>
          ) : (
            <span className="text-zinc-600 hover:text-zinc-400 cursor-help" title="Type 'mcp' to enable AI agent mode">
              mcp
            </span>
          )}
        </div>
      </div>
    </Card>
    </section>
  )
}
