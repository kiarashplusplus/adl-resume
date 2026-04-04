/**
 * Project data for portfolio
 * Used by MCP tools and terminal commands
 */

export interface Project {
  id: string
  title: string
  description: string
  shortDescription: string
  stack: string[]
  metrics: {
    label: string
    value: string
  }[]
  status: "live" | "development" | "completed"
  links: {
    website?: string
    github?: string
    demo?: string
  }
  impact: string
  category: "ai" | "saas" | "open-source" | "startup"
}

export const projects: Record<string, Project> = {
  fiml: {
    id: "fiml",
    title: "Financial Intelligence Meta-Layer (FIML)",
    description:
      "AI-native MCP server for financial data aggregation with intelligent multi-provider orchestration and multilingual compliance guardrails. Open source project demonstrating enterprise-grade AI architecture.",
    shortDescription: "AI-native MCP server for financial data aggregation",
    stack: ["Python", "MCP Server", "AI Orchestration", "Expo", "CI/CD"],
    metrics: [
      { label: "Lines of Code", value: "32K+" },
      { label: "Automated Tests", value: "1,403" },
      { label: "Pass Rate", value: "100%" },
      { label: "Status", value: "Phase 2" },
    ],
    status: "development",
    links: {
      website: "https://kiarashplusplus.github.io/FIML/",
      github: "https://github.com/kiarashplusplus/FIML",
    },
    impact: "Reduces financial data integration time by 70%",
    category: "open-source",
  },
  aligna: {
    id: "aligna",
    title: "Aligna",
    description:
      "Conversational AI recruiter that schedules and conducts voice interviews via LiveKit, transcribes with Azure OpenAI, and performs automated candidate-job matching with full observability.",
    shortDescription: "Conversational AI recruiter with voice interviews",
    stack: ["Next.js", "LiveKit", "Azure OpenAI", "PostgreSQL", "Docker"],
    metrics: [
      { label: "Feature", value: "AI Voice Interviews" },
      { label: "a Production AI", value: "Built" },
      { label: "Matching", value: "2-Way Smart" },
      { label: "Observability", value: "Full" },
    ],
    status: "live",
    links: {
      website: "https://www.align-a.com/about"
    },
    impact: "Helps startups cut hiring time with AI interviews",
    category: "saas",
  },
  bayan: {
    id: "bayan",
    title: "Bayan",
    description:
      "The only app providing bilingual Farsi-English literary analysis of classical Persian poetry, decoding Sufi symbolism, historical allusions, and archaic vocabulary. Fully offline with verse text sourced from a verified canonical corpus rather than AI-generated.",
    shortDescription: "Bilingual Farsi-English classical Persian poetry analysis",
    stack: ["Swift", "SwiftUI", "CoreData", "NLP", "iOS"],
    metrics: [
      { label: "Poems", value: "13,828" },
      { label: "Dictionary Entries", value: "33,640" },
      { label: "Searchable Verses", value: "106,037" },
      { label: "Test Functions", value: "128+" },
    ],
    status: "live",
    links: {
      website: "https://trybayan.com",
    },
    impact: "Only bilingual Farsi-English Persian poetry analysis app with verified canonical corpus",
    category: "ai",
  },
  aivision: {
    id: "aivision",
    title: "AI Vision",
    description:
      "Patent-pending AI and computer vision solutions for home services industry. Founder and CEO. Mobile app live on App Store.",
    shortDescription: "AI/CV solutions for home services",
    stack: ["Computer Vision", "iOS", "Machine Learning", "Mobile"],
    metrics: [
      { label: "Status", value: "App Store Live" },
      { label: "Progress", value: "80%" },
    ],
    status: "live",
    links: {},
    impact: "Patent-pending CV technology for home services",
    category: "startup",
  },
}

export const projectList = Object.values(projects)

export function getProjectById(id: string): Project | undefined {
  return projects[id.toLowerCase()]
}

export function getAllProjectIds(): string[] {
  return Object.keys(projects)
}
