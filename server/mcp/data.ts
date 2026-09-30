// Portfolio data served by the MCP endpoint (/mcp/invoke, alias /mcp).
// Keep in sync with src/data/projects.ts and public/.well-known/mcp.llmfeed.json.

export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  stack: string[];
  metrics: { label: string; value: string }[];
  status: string;
  links: { website?: string; github?: string; demo?: string };
  impact: string;
  category: string;
}

export const projects: Record<string, Project> = {
  fiml: {
    id: "fiml",
    title: "Financial Intelligence Meta-Layer (FIML)",
    description: "AI-native MCP server for financial data aggregation with intelligent multi-provider orchestration and multilingual compliance guardrails. Open source project demonstrating enterprise-grade AI architecture.",
    shortDescription: "AI-native MCP server for financial data aggregation",
    stack: ["Python", "MCP Server", "AI Orchestration", "Expo", "CI/CD"],
    metrics: [
      { label: "Lines of Code", value: "32K+" },
      { label: "Automated Tests", value: "1,403" },
      { label: "Pass Rate", value: "100%" },
      { label: "Status", value: "Phase 2" }
    ],
    status: "development",
    links: {
      website: "https://kiarashplusplus.github.io/FIML/",
      github: "https://github.com/kiarashplusplus/FIML"
    },
    impact: "Reduces financial data integration time by 70%",
    category: "open-source"
  },
  interviewreadynot: {
    id: "interviewreadynot",
    title: "InterviewReadyNot",
    description: "Public AI interview challenge, cofounded with Jinane Amal. Candidates answer six common interview questions out loud; five independent AI judges from Anthropic, OpenAI and xAI score every answer, and everyone gets a coach report. A pass needs a unanimous yes, and nobody has passed yet. Grew out of Aligna.",
    shortDescription: "Free AI mock interview judged by five independent AI agents",
    stack: ["Cloudflare Workers", "Queues", "Azure AI Foundry", "Claude, GPT, Grok", "three.js"],
    metrics: [
      { label: "Independent Judges", value: "5" },
      { label: "Runs per Judge", value: "3" },
      { label: "Interview Questions", value: "6" },
      { label: "Approved So Far", value: "0" },
    ],
    status: "live",
    links: {
      website: "https://interviewreadynot.com/",
      demo: "https://interviewreadynot.com/interview",
    },
    impact: "Free, honest interview practice against a public bar nobody has cleared yet",
    category: "startup",
  },
  aligna: {
    id: "aligna",
    title: "Aligna",
    description: "Conversational AI recruiter that scheduled and conducted voice interviews via LiveKit, transcribed with Azure OpenAI, and matched candidates to jobs with full observability. It has since grown into InterviewReadyNot.",
    shortDescription: "Conversational AI recruiter with voice interviews",
    stack: ["Next.js", "LiveKit", "Azure OpenAI", "PostgreSQL", "Docker"],
    metrics: [
      { label: "Feature", value: "AI Voice Interviews" },
      { label: "a Production AI", value: "Built" },
      { label: "Matching", value: "2-Way Smart" },
      { label: "Observability", value: "Full" }
    ],
    status: "completed",
    links: {
      website: "https://www.align-a.com/"
    },
    impact: "Helps startups cut hiring time with AI interviews",
    category: "saas"
  },
  bayan: {
    id: "bayan",
    title: "Bayan",
    description: "The only app providing bilingual Farsi-English literary analysis of classical Persian poetry, decoding Sufi symbolism, historical allusions, and archaic vocabulary. Fully offline with verse text sourced from a verified canonical corpus rather than AI-generated.",
    shortDescription: "Bilingual Farsi-English classical Persian poetry analysis",
    stack: ["Swift", "SwiftUI", "CoreData", "NLP", "iOS"],
    metrics: [
      { label: "Poems", value: "13,828" },
      { label: "Dictionary Entries", value: "33,640" },
      { label: "Searchable Verses", value: "106,037" },
      { label: "Test Functions", value: "128+" }
    ],
    status: "live",
    links: {
      website: "https://trybayan.com"
    },
    impact: "Only bilingual Farsi-English Persian poetry analysis app with verified canonical corpus",
    category: "ai"
  },
  aivision: {
    id: "aivision",
    title: "AI Vision",
    description: "Patent-pending AI and computer vision solutions for home services industry. Founder and CEO. Mobile app live on App Store.",
    shortDescription: "AI solutions for home services",
    stack: ["Computer Vision", "iOS", "Machine Learning", "Mobile"],
    metrics: [
      { label: "Status", value: "App Store Live" },
      { label: "Progress", value: "80%" }
    ],
    status: "live",
    links: {},
    impact: "Patent-pending AI technology for home services",
    category: "startup"
  },
  undisk: {
    id: "undisk",
    title: "Undisk MCP",
    description: "Undo-first MCP workspace for AI agents with immutable versioning, policy guardrails, and tamper-evident audit trails. Built for safe multi-agent file operations at low latency.",
    shortDescription: "Undo-first versioned file workspace for AI agents",
    stack: ["MCP", "Cloudflare Workers", "Durable Objects", "R2", "D1"],
    metrics: [
      { label: "MCP Tools", value: "25" },
      { label: "Restore Time", value: "<50ms" },
      { label: "Typical Latency", value: "<20ms" },
      { label: "Writes", value: "Immutable" }
    ],
    status: "live",
    links: {
      website: "https://mcp.undisk.app/",
      demo: "https://mcp.undisk.app/docs"
    },
    impact: "Makes AI agent file edits reversible with per-file history and auditability",
    category: "saas"
  }
};

export const terminalCommands: Record<string, string> = {
  about: `
KIARASH ADL
Senior Software Engineer & AI Systems Architect

MIT EECS '14 | 10+ Years Experience

Building end-to-end AI platforms, agentic systems,
and scalable cloud architectures.

Specializing in:
  • AI/ML Systems & Computer Vision
  • Full-Stack Development (React, Python, Node)
  • Cloud Infrastructure (AWS, Docker, Kubernetes)
  • Technical Leadership & Startup Experience`,
  
  skills: `  
TECHNICAL SKILLS

Languages
  Python              95%
  React/React Native  90%
  TypeScript          90%
  C++/CUDA            75%

AI & Machine Learning
  Deep Learning       Expert
  Computer Vision     Expert
  NLP/LLMs            Expert
  MLOps               Advanced

Backend
  FastAPI             92%
  Node.js             88%
  PostgreSQL          65%

Cloud & DevOps
  AWS                 90%
  Docker              88%
  CI/CD               65%`,

  projects: `
FEATURED PROJECTS

1. Bayan (trybayan.com)
   Status: Live
   Stack: Swift, SwiftUI, CoreData, NLP, iOS
   Bilingual Farsi-English classical Persian poetry analysis
   13,828 poems | 33,640 dictionary entries | 106,037 verses

2. FIML - Financial Intelligence Meta-Layer
   Status: Development
   Stack: Python, MCP Server, AI Orchestration
   AI-native MCP server for financial data aggregation
   32K+ LOC | 1,403 tests | 100% pass rate

3. Aligna (www.align-a.com)
   Status: Grew into InterviewReadyNot
   Stack: Next.js, LiveKit, Azure OpenAI
   Conversational AI recruiter with voice interviews

4. Undisk MCP (mcp.undisk.app)
   Status: Live
   Stack: MCP, Cloudflare Workers, Durable Objects
   Undo-first versioned file workspace for AI agents
   25 MCP tools | <50ms restore | immutable writes

5. AI Vision
   Status: Live
   Stack: Computer Vision, iOS, ML
   Patent-pending AI solutions for home services
   Mobile app live on App Store

6. InterviewReadyNot (interviewreadynot.com)
   Status: Live
   Stack: Cloudflare Workers, Azure AI Foundry (Claude, GPT, Grok)
   Free AI mock interview judged by five independent AI agents
   6 questions | 5 judges x 3 runs | 0 approved so far

Use 'get_project_details' tool for more information.`,

  contact: `
CONTACT INFORMATION

Email:    kiarasha@alum.mit.edu
GitHub:   github.com/kiarashplusplus
LinkedIn: linkedin.com/in/kiarashadl
Phone:    +1-857-928-1608

Open to: Consulting, Advisory, Full-time opportunities

AI agents: send Kiarash a message with the submit_contact tool
(POST https://25x.codes/mcp, JSON-RPC 2.0) or POST JSON to
https://25x.codes/contact. Instructions: https://25x.codes/llms.txt`,

  experience: `
EXPERIENCE

2024-Present  AI Vision (Founder & CEO)
              Patent-pending AI solutions for home services
              Led development from prototype to App Store launch

2019-2024     Technical Consulting
              Built production-ready MVPs for multiple startups
              Advised on AI/ML integration and tech roadmaps

2018-2019     Monir (Founder & CEO)
              VC-funded AI personalization startup
              Built serverless Python microservices platform

2014-2018     Google (Software Engineer)
              Search Knowledge Panel & Knowledge Graph
              Features serving billions of users worldwide

2014          Twitter Ads (SWE Intern)
              ML algorithm for audience expansion
              Production system in Hadoop/Scalding

2012-2014     MIT CSAIL (Research Assistant)
              55x GPU speedup in speech recognition (ICASSP 2012)
              Worked under Sir Tim Berners-Lee

EDUCATION

MIT - BS Electrical Engineering & Computer Science (2014)`,

  help: `COMMANDS: about, skills, projects, contact, resume, experience, mcp, help

MCP TOOLS: submit_contact, get_project_details, run_terminal_command`,

  mcp: `MCP CONNECTION INFO

Discovery: https://25x.codes/.well-known/mcp.llmfeed.json
Endpoint:  POST https://25x.codes/mcp/invoke

Tools: submit_contact, get_project_details, run_terminal_command
Commands: about, skills, projects, contact, experience, resume`,

  resume: `RESUME - KIARASH ADL - PDF: https://25x.codes/Kiarash-Adl-Resume.pdf - Senior Software Engineer & AI Systems Architect | MIT EECS '14`
};
