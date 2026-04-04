import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionDivider } from "@/components/SectionDivider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronUpIcon } from "@/components/icons/CriticalIcons"
import { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react"
import { toast } from "sonner"

// Animated hero visual component - loaded eagerly for LCP
import { AnimatedHeroVisual } from "@/components/AnimatedHeroVisual"

// Lightweight components loaded immediately
import { ThemeToggle } from "@/components/ThemeToggle"
import { SoundToggle } from "@/components/SoundToggle"
import { useSound } from "@/hooks/useSoundEffects"
import { TypewriterTagline } from "@/components/TypewriterTagline"
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation"
import { useNativeScroll } from "@/hooks/useNativeScroll"
import { useTouchGestures } from "@/hooks/useTouchGestures"
import { ScrollReveal, ScrollRevealContainer } from "@/components/ScrollReveal"

// Onboarding modal - loaded immediately (critical for first-time visitors)
// This is the first thing new users see, so it must not be lazy-loaded
import { OnboardingChoice } from "@/components/OnboardingChoice"

// Decorative components lazy-loaded (not critical for initial render)
const KeyboardHelp = lazy(() => import("@/components/KeyboardHelp").then(m => ({ default: m.KeyboardHelp })))
import { SkipLinks, useA11y } from "@/components/A11yProvider"
import { TextScramble } from "@/components/TextScramble"
import { AnimatedName } from "@/components/AnimatedName"
import { GradientFlowText, ElasticText } from "@/components/KineticTypography"

// Easter egg - deferred load (not needed for initial interaction)
const EasterEgg = lazy(() => 
  new Promise<{ default: typeof import("@/components/EasterEgg").EasterEgg }>(resolve => {
    // Delay loading until after LCP (requestIdleCallback or 2s timeout)
    const load = () => import("@/components/EasterEgg").then(m => resolve({ default: m.EasterEgg }))
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 3000 })
    } else {
      setTimeout(load, 2000)
    }
  })
)

// Heavy components lazy loaded for better initial performance
const GitHubActivity = lazy(() => import("@/components/GitHubActivity").then(m => ({ default: m.GitHubActivity })))
const TechStack = lazy(() => import("@/components/TechStack").then(m => ({ default: m.TechStack })))
const EngineeringMetrics = lazy(() => import("@/components/EngineeringMetrics").then(m => ({ default: m.EngineeringMetrics })))
const TerminalSection = lazy(() => import("@/components/TerminalSection").then(m => ({ default: m.TerminalSection })))
const Guestbook = lazy(() => import("@/components/Guestbook").then(m => ({ default: m.Guestbook })))
const InteractiveTimeline = lazy(() => import("@/components/InteractiveTimeline").then(m => ({ default: m.InteractiveTimeline })))
const DeveloperHero = lazy(() => import("@/components/DeveloperHero").then(m => ({ default: m.DeveloperHero })))
const WebMCPSection = lazy(() => import("@/components/WebMCPSection").then(m => ({ default: m.WebMCPSection })))

// Recharts components lazy loaded (heavy charting library)
const SkillsCharts = lazy(() => import("@/components/SkillsCharts"))

// Lucide icons - lazy loaded via dynamic import to avoid blocking critical render path
// These icons are only used below-the-fold (contact, footer, projects)
import {
  MailIcon as Mail,
  PhoneIcon as Phone,
  DownloadIcon as Download,
  GithubIcon as Github,
  LinkedinIcon as Linkedin,
  ArrowUpRightIcon as ArrowUpRight,
  SendIcon as Send,
  LinkIcon as Link,
  CalendarIcon as Calendar,
  BotIcon as Bot,
  CopyIcon as Copy,
  CheckIcon as Check,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
} from "@/components/icons/LazyIcons"

// Loading fallback component with SEO-friendly content for AI agents
const SectionLoader = ({ height = "h-64", section = "content" }: { height?: string; section?: string }) => (
  <div className={`${height} flex items-center justify-center relative overflow-hidden rounded-2xl`}>
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5" />
    
    {/* Subtle grid pattern */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    />
    
    <div className="relative text-center p-6">
      {/* Premium loading spinner */}
      <div className="relative w-12 h-12 mx-auto mb-4">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        {/* Spinning gradient arc */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-rose-500 animate-spin" />
        {/* Inner pulse */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500/20 to-rose-500/20 animate-pulse" />
      </div>
      
      <p className="text-muted-foreground text-sm font-medium">
        Loading <span className="text-foreground">{section}</span>
      </p>
      <div className="flex items-center justify-center gap-1 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      
      {/* SEO content for AI agents - hidden visually but accessible */}
      <noscript>
        <p>Kiarash Adl - AI Systems Architect portfolio. Contact: kiarasha@alum.mit.edu</p>
      </noscript>
    </div>
  </div>
)

// AI Agent Chat Button Component
function AIAgentButton() {
  const [copied, setCopied] = useState(false)
  const mcpPrompt = "Kiarash Adl's portfolio website is online https://25x.codes and you might be able to connect to his MCP server: https://25x.codes/.well-known/mcp.llmfeed.json and then run the commands: about, skills, projects, experience, and contact or submit_contact? Eitherway, tell us about Kiarash Adl."
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mcpPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 10000)
    } catch {
      // Silent fail - the UI will show the copied state didn't change
    }
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleCopy}
        className="group relative flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-cyan-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-cyan-500/20 border border-violet-500/30 hover:border-violet-500/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5"
      >
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 group-hover:from-violet-500/30 group-hover:to-cyan-500/30 transition-colors">
          <Bot className="h-4 w-4 text-violet-500" />
        </div>
        <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
          Talk to AI About This Portfolio
        </span>
        <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
          )}
        </div>
        
        {/* Animated glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
      </button>
      
      {/* Inline feedback message - more reliable than toast on older mobile devices */}
      {copied ? (
        <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-medium text-emerald-500">
            ✓ Copied to clipboard!
          </span>
          <span className="text-[10px] text-muted-foreground text-center max-w-[220px]">
            Paste into Claude Desktop or Grok to chat about this portfolio
          </span>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground/70">
          Tested on Claude Desktop & Grok
        </span>
      )}
    </div>
  )
}

function App() {
  // Start with null to indicate we haven't checked localStorage yet
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)
  const [visitorType, setVisitorType] = useState<"developer" | "visitor" | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  
  // Wait for fonts to load before showing any UI
  useEffect(() => {
    // Check if fonts API is available
    if ('fonts' in document) {
      // Check if already loaded (cached)
      if (document.documentElement.classList.contains('fonts-loaded')) {
        setFontsReady(true)
      } else {
        document.fonts.ready.then(() => {
          setFontsReady(true)
        })
      }
    } else {
      // Fonts API not available, show UI after a short delay
      setTimeout(() => setFontsReady(true), 100)
    }
  }, [])
  
  useEffect(() => {
    // Disable browser scroll restoration - we control the view via state, not scroll position
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }
    // Always start at top
    window.scrollTo({ top: 0, behavior: "instant" })
    
    // Check if user has already made a choice
    try {
      const savedType = localStorage.getItem("kiarash-visitor-type")
      
      // Validate that the saved type is one of our expected values
      if (savedType === "developer" || savedType === "visitor") {
        setVisitorType(savedType)
        setShowOnboarding(false)
      } else {
        // Clear any invalid values and show onboarding
        if (savedType !== null) {
          localStorage.removeItem("kiarash-visitor-type")
        }
        setShowOnboarding(true)
      }
    } catch {
      // localStorage might not be available (private browsing, etc.)
      setShowOnboarding(true)
    }
  }, [])
  
  // Handle onboarding choice - NO scrolling needed, view mode changes content order
  const handleOnboardingChoice = (isDeveloper: boolean) => {
    const type = isDeveloper ? "developer" : "visitor"
    setVisitorType(type)
    setShowOnboarding(false)
    
    // Store preference safely (localStorage might throw in some browsers)
    try {
      localStorage.setItem("kiarash-visitor-type", type)
    } catch {
      // localStorage not available, preference won't persist
    }
    
    // Ensure we're at the top when transitioning
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  
  // Switch between developer and visitor modes
  const switchToVisitorMode = () => {
    setVisitorType("visitor")
    try {
      localStorage.setItem("kiarash-visitor-type", "visitor")
    } catch {
      // localStorage not available
    }
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  
  const switchToDeveloperMode = () => {
    setVisitorType("developer")
    try {
      localStorage.setItem("kiarash-visitor-type", "developer")
    } catch {
      // localStorage not available
    }
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  
  // Helper to check if developer mode
  const isDeveloperMode = visitorType === "developer"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Navigation sections for scroll tracking - different for each mode
  const navItems = isDeveloperMode ? [
    { id: "home", label: "Home" },
    { id: "terminal", label: "Terminal" },
    { id: "showcase", label: "Showcase" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "contact", label: "Contact" }
  ] : [
    { id: "home", label: "Home" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "showcase", label: "Showcase" },
    { id: "experience", label: "Experience" },
    { id: "contact", label: "Contact" }
  ]
  
  // Use native scroll tracking (saves ~120KB by not loading framer-motion for scroll)
  const { 
    isNavVisible, 
    showScrollTop, 
    scrollProgress, 
    activeSection 
  } = useNativeScroll(navItems.map(item => item.id))

  // Sound effects for interactions
  const { playWhoosh, playSuccess, playHover, playSwoosh } = useSound()

  // Accessibility context
  const { announce, prefersReducedMotion } = useA11y()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const { name, value } = target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields")
      announce("Form error: Please fill in all required fields", "assertive")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      announce("Form error: Please enter a valid email address", "assertive")
      return
    }

    setIsSubmitting(true)
    announce("Sending message, please wait")

    try {
      // Send to Cloudflare Pages Function
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      playSuccess()
      toast.success("Message sent successfully! I'll get back to you soon.")
      announce("Message sent successfully", "assertive")
      
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      })
    } catch (error) {
      console.error('Form submission error:', error)
      const errorMsg = error instanceof Error ? error.message : "Failed to send message. Please try emailing directly."
      toast.error(errorMsg)
      announce(`Error: ${errorMsg}`, "assertive")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const scrollToSection = useCallback((sectionId: string) => {
    playWhoosh()
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? "instant" : "smooth"
      })
      
      // Announce section navigation to screen readers
      const sectionLabel = navItems.find(item => item.id === sectionId)?.label || sectionId
      announce(`Navigated to ${sectionLabel} section`)
    }
  // navItems is a module-level constant, doesn't need to be in deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playWhoosh, prefersReducedMotion, announce])
  
  const scrollToTop = () => {
    playSwoosh()
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth"
    })
    announce("Scrolled to top of page")
  }

  // Keyboard navigation hook
  const sections = navItems.map(item => item.id)
  const { showHelp, setShowHelp } = useKeyboardNavigation({
    sections,
    scrollToSection,
    scrollToTop
  })

  // Touch gesture navigation for mobile devices
  const mainRef = useRef<HTMLDivElement>(null)
  const navScrollRef = useRef<HTMLDivElement>(null)
  const [swipeHint, setSwipeHint] = useState(false)
  
  // Auto-scroll nav to keep active button visible and centered on mobile
  useEffect(() => {
    if (!navScrollRef.current || !activeSection) return
    
    const container = navScrollRef.current
    const activeButton = container.querySelector(`button[aria-current="page"]`) as HTMLElement
    
    if (activeButton) {
      // Always scroll to center the active button for better UX on mobile
      const scrollLeft = activeButton.offsetLeft - (container.clientWidth / 2) + (activeButton.clientWidth / 2)
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })
    }
  }, [activeSection])
  
  // Navigate to next/previous section via swipe
  const navigateToNextSection = useCallback(() => {
    const currentIndex = sections.indexOf(activeSection)
    if (currentIndex < sections.length - 1) {
      scrollToSection(sections[currentIndex + 1])
    }
  }, [activeSection, sections, scrollToSection])
  
  const navigateToPrevSection = useCallback(() => {
    const currentIndex = sections.indexOf(activeSection)
    if (currentIndex > 0) {
      scrollToSection(sections[currentIndex - 1])
    }
  }, [activeSection, sections, scrollToSection])

  // Touch gestures for swipe navigation (horizontal swipes between sections)
  useTouchGestures(mainRef, {
    onSwipeLeft: navigateToNextSection,
    onSwipeRight: navigateToPrevSection,
    threshold: 40, // Lower threshold - velocity helps detect fast swipes
    velocityThreshold: 0.25, // Sensitive to fast flicks
    directionRatio: 1.5, // Must be 50% more horizontal than vertical
    maxSwipeTime: 350, // Quick swipes only
    enabled: !prefersReducedMotion
  })

  // Show swipe hint on first visit (mobile only)
  const swipeHintDismissedRef = useRef(false)
  
  useEffect(() => {
    if ('ontouchstart' in window) {
      const hasSeenHint = localStorage.getItem('kiarash-swipe-hint')
      if (!hasSeenHint && !showOnboarding) {
        const showTimer = setTimeout(() => {
          if (!swipeHintDismissedRef.current) {
            setSwipeHint(true)
          }
        }, 2000)
        
        const hideTimer = setTimeout(() => {
          if (!swipeHintDismissedRef.current) {
            setSwipeHint(false)
            localStorage.setItem('kiarash-swipe-hint', 'true')
          }
        }, 6000) // 2000 + 4000
        
        return () => {
          clearTimeout(showTimer)
          clearTimeout(hideTimer)
        }
      }
    }
    return undefined
  }, [showOnboarding])
  
  // Handler to dismiss swipe hint
  const dismissSwipeHint = useCallback(() => {
    swipeHintDismissedRef.current = true
    setSwipeHint(false)
    try { localStorage.setItem('kiarash-swipe-hint', 'true') } catch { /* localStorage not available */ }
  }, [])

  // Don't render anything until fonts are loaded and localStorage is checked
  // This prevents FOUT (Flash of Unstyled Text) during onboarding
  const isReady = fontsReady && showOnboarding !== null

  return (
    <>
      {/* Skip Links for keyboard/screen reader navigation */}
      <SkipLinks />
      
      {/* Easter Egg - Konami Code - deferred load after page is interactive */}
      {isReady && !showOnboarding && (
        <Suspense fallback={null}>
          <EasterEgg />
        </Suspense>
      )}
      
      {/* Show nothing while loading fonts and checking localStorage */}
      {!isReady ? (
        <div className="min-h-screen bg-background" />
      ) : showOnboarding ? (
        /* Onboarding Choice Modal - loaded with main bundle for instant display */
        <OnboardingChoice onChoice={handleOnboardingChoice} />
      ) : (
        /* Main content - only renders after onboarding is complete */
        <div ref={mainRef} className="min-h-screen bg-background section-swipe-container">
      
      {/* Swipe Hint Overlay - shows on first mobile visit, tap anywhere to dismiss */}
      {swipeHint && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-500 cursor-pointer"
          aria-hidden="true"
          onClick={dismissSwipeHint}
          onTouchEnd={dismissSwipeHint}
        >
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/90 border border-border shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4">
              <ChevronLeft className="h-8 w-8 text-primary swipe-hint" />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
              </div>
              <ChevronRight className="h-8 w-8 text-primary swipe-hint" style={{ animationDirection: 'reverse' }} />
            </div>
            <p className="text-sm font-medium text-foreground">Swipe to navigate sections</p>
            <p className="text-xs text-muted-foreground">Tap anywhere to dismiss</p>
          </div>
        </div>
      )}
      
      {/* Scroll Progress Bar - GPU-accelerated with glow effect */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-[60] transition-opacity duration-300 overflow-hidden ${
          scrollProgress > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      >
        {/* Track background */}
        <div className="absolute inset-0 bg-muted/30" />
        
        {/* Progress fill - uses scaleX for GPU acceleration */}
        <div
          className="absolute inset-y-0 left-0 right-0 origin-left will-change-transform"
          style={{ 
            transform: `scaleX(${scrollProgress / 100})`,
            contain: 'layout style paint',
          }}
        >
          {/* Gradient fill */}
          <div className="absolute inset-0 bg-primary" />
          
          {/* Glow effect at the leading edge - contained within parent */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, transparent, oklch(from var(--primary) l c h / 0.5))',
            }}
          />
        </div>
        
        {/* Section markers */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {navItems.map((item, index) => {
            const position = ((index + 1) / navItems.length) * 100
            const isPast = scrollProgress >= position - 5
            return (
              <div
                key={item.id}
                className={`absolute w-1 h-1 rounded-full transition-all duration-300 ${
                  isPast ? 'bg-primary-foreground scale-150' : 'bg-muted-foreground/50 scale-100'
                }`}
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                title={item.label}
              />
            )
          })}
        </div>
      </div>

      {/* Navigation - Beautiful glassmorphism with gradient border */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isNavVisible 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        } ${prefersReducedMotion ? '!transition-none' : ''}`}
        aria-label="Main navigation"
      >
        {/* Bottom border */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Solid background - no backdrop-blur for performance */}
        <div className="absolute inset-0 bg-background shadow-sm" />
        
        <div className="max-w-5xl mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => scrollToSection("home")}
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground hover:from-primary hover:to-accent transition-all duration-300 flex-shrink-0 z-10 relative hover:scale-105 active:scale-95"
              aria-label="Go to home section"
            >
              Kiarash Adl
            </button>
            
            {/* Nav links - scrollable on mobile with fade edges */}
            <div className="flex-1 min-w-0 mx-2 relative">
              {/* Left fade gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              {/* Right fade gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              
              <div ref={navScrollRef} className="overflow-x-auto scrollbar-hide" role="navigation">
                <div className="flex items-center gap-1 w-max px-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      onMouseEnter={playHover}
                      className={`min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 whitespace-nowrap relative overflow-hidden group ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                      aria-current={activeSection === item.id ? "page" : undefined}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Toggles - always visible, never scroll */}
            <div className="flex items-center gap-1.5 flex-shrink-0 border-l border-border/30 pl-2 z-10 relative">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" role="main" aria-label="Portfolio content" tabIndex={-1}>
      
      {/* DEVELOPER MODE: Show Terminal-first layout */}
      {isDeveloperMode ? (
        <>
          {/* Developer Hero - Compact terminal-focused header */}
          <Suspense fallback={<div className="h-48 bg-background" />}>
            <DeveloperHero 
              onSwitchToVisitor={switchToVisitorMode} 
              prefersReducedMotion={prefersReducedMotion}
            />
          </Suspense>
          
          {/* Terminal Section - Immediately visible for developers */}
          <section id="terminal" className="py-8 px-6 scroll-mt-20 relative">
            <div className="max-w-5xl mx-auto relative z-10">
              <Suspense fallback={<SectionLoader height="h-96" section="terminal" />}>
                <TerminalSection />
              </Suspense>
            </div>
          </section>
          
          <SectionDivider variant="gradient" />
          
          {/* Developer Showcase Section - After terminal */}
          <section id="showcase" className="py-16 px-6 md:py-20 scroll-mt-20 relative">
            <div className="max-w-5xl mx-auto relative z-10">
              <ScrollRevealContainer>
                <ScrollReveal className="scroll-reveal-child mb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" />
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">Developer</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Developer Showcase</h2>
                  <p className="text-muted-foreground">
                    Interactive demonstrations of engineering capabilities and code quality
                  </p>
                </ScrollReveal>

                <ScrollReveal className="scroll-reveal-child mb-8">
                  <Suspense fallback={<SectionLoader />}>
                    <EngineeringMetrics />
                  </Suspense>
                </ScrollReveal>

                <ScrollReveal className="scroll-reveal-child mb-8">
                  <Suspense fallback={<SectionLoader />}>
                    <TechStack />
                  </Suspense>
                </ScrollReveal>

                <ScrollReveal className="scroll-reveal-child mb-8">
                  <Suspense fallback={<SectionLoader />}>
                    <GitHubActivity />
                  </Suspense>
                </ScrollReveal>
              </ScrollRevealContainer>
            </div>
          </section>
          
          <SectionDivider variant="sparkle" />

          {/* WebMCP Section - AI Agent Integration */}
          <section id="webmcp" className="py-16 px-6 md:py-20 scroll-mt-20 relative">
            <div className="max-w-5xl mx-auto relative z-10">
              <Suspense fallback={<SectionLoader section="WebMCP" />}>
                <WebMCPSection />
              </Suspense>
            </div>
          </section>
          
          <SectionDivider variant="gradient" />
        </>
      ) : (
        <>
      {/* VISITOR MODE: Show standard Hero-first layout */}
      {/* Hero Section - Beautiful glassmorphism with floating elements */}
      <header 
        id="home"
        className="relative py-16 px-6 md:py-24 overflow-hidden hero-pattern"
      >
        {/* Decorative gradient elements - very subtle in light mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none dark:block hidden" aria-hidden="true">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute top-40 right-[15%] w-96 h-96 bg-accent/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-[20%] w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Animated Hero Visual - Eagerly loaded for optimal LCP */}
            <AnimatedHeroVisual prefersReducedMotion={prefersReducedMotion} />
            
            <div className="flex-1 text-center md:text-left">
              {/* Live Status - Enhanced pulsing button with sub-line */}
              <div className="flex flex-col items-center md:items-start gap-1 mb-4">
                <a href="#contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors duration-300 cursor-pointer group">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Available for Work
                  </span>
                </a>
                <span className="text-xs text-muted-foreground mt-1">Let's build your AI dream team, starting today</span>
              </div>
              
              {/* Primary Name - Animated letter reveal with hover effects */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-foreground overflow-hidden">
                <AnimatedName name="Kiarash Adl" delay={100} />
              </h1>
              <TypewriterTagline />
              
              {/* Quick Stats with glassmorphism */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium glass">
                  <span className="mr-1.5">🎓</span> MIT EECS '14
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium glass">
                  <span className="mr-1.5">⚡</span> 10+ Years Experience
                </Badge>
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium border-primary/30 text-primary bg-primary/5">
                  <span className="mr-1.5">🤖</span> Human + AI Projects
                </Badge>
              </div>
              
              {/* What I Deliver - Outcome-focused for non-coders with icons */}
              <p className="text-lg md:text-xl text-foreground/90 mb-5 max-w-xl leading-relaxed">
                I build <span className="font-semibold text-primary">AI tools that automate workflows</span>, chat like humans, and scale effortlessly. <span className="font-medium italic text-primary/90">No coding required from you.</span>
              </p>
              
              {/* What I Deliver - Beautiful icon cards for non-coders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-xl">
                <div className="group p-3 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-xl group-hover:scale-105 transition-transform duration-200">
                      💬
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">AI Chatbots</div>
                      <div className="text-xs text-muted-foreground leading-snug">Make your app talk back intelligently</div>
                    </div>
                  </div>
                </div>
                
                <div className="group p-3 rounded-xl bg-accent/5 border border-accent/20 hover:border-accent/40 hover:bg-accent/10 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-accent/10 flex items-center justify-center text-xl group-hover:scale-105 transition-transform duration-200">
                      🚀
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">End-to-End</div>
                      <div className="text-xs text-muted-foreground leading-snug">From idea to launch, millions of users</div>
                    </div>
                  </div>
                </div>
                
                <div className="group p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl group-hover:scale-105 transition-transform duration-200">
                      ☁️
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">Cloud Magic</div>
                      <div className="text-xs text-muted-foreground leading-snug">Secure, fast, scales with you</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fun Fact - Personal touch */}
              <div className="mb-6 p-3 rounded-xl bg-muted/50 border border-border/50 max-w-xl">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">✨ Fun fact:</span> I built my first startup at 14.
                </p>
              </div>
              
              {/* Contact & Socials - Personalized CTAs with glow effects */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 text-sm font-semibold group"
                  onClick={() => window.open("https://calendly.com/kiarasha-alum/30min", "_blank")}
                >
                  <Mail className="h-[18px] w-[18px]" />
                  <span>Book a Free AI Chat</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted/80 hover:bg-muted rounded-xl transition-all duration-300 text-sm font-medium group hover:shadow-lg hover:-translate-y-0.5 border border-border/50"
                  onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}
                >
                  <span>🎯</span>
                  <span>See My Work</span>
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted/80 hover:bg-muted rounded-xl transition-all duration-300 text-sm font-medium group hover:shadow-lg hover:-translate-y-0.5 border border-border/50"
                  onClick={() => window.open("https://www.linkedin.com/in/kiarashadl/", "_blank")}
                >
                  <Linkedin className="h-[18px] w-[18px] text-primary" />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SectionDivider variant="sparkle" />

      <section className="py-12 px-6 md:py-16 relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <ScrollReveal className="text-center">
            <p className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/80 italic leading-relaxed">
              Simple ideas are hard-earned, but that's where true power lives.
            </p>
          </ScrollReveal>
        </div>
      </section>
        </>
      )}
      
      {/* SHARED: Projects section - both modes see this */}
      <SectionDivider variant="constellation" />

      <section id="projects" className="py-16 px-6 md:py-20 scroll-mt-20 relative" tabIndex={-1} aria-labelledby="projects-heading">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollRevealContainer>
            <ScrollReveal className="scroll-reveal-child mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" aria-hidden="true" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Portfolio</span>
              </div>
              <h2 id="projects-heading" className="text-3xl md:text-4xl font-bold">
                <TextScramble 
                  text="Featured Projects" 
                  scrambleOnMount={false}
                  scrambleOnView={true}
                  delay={200}
                />
              </h2>
            </ScrollReveal>
            
            <div className="space-y-6" role="list" aria-label="Featured projects">
              <ScrollReveal className="scroll-reveal-child">
                <article className="group relative project" itemScope itemType="https://schema.org/MobileApplication">
                  {/* Gradient glow on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500" />
                  
                  <Card className="relative p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:border-emerald-500/40 bg-card overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl md:text-2xl font-bold group-hover:text-emerald-500 transition-colors" itemProp="name">
                            <a href="https://trybayan.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Bayan</a>
                          </h3>
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10 text-xs" itemProp="applicationCategory">iOS App</Badge>
                          <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10 text-xs">Live</Badge>
                        </div>
                        <p className="text-foreground/80 mb-4 leading-relaxed" itemProp="description">
                          The only app providing bilingual Farsi-English literary analysis of classical Persian poetry, decoding Sufi symbolism, historical allusions, and archaic vocabulary. Fully offline, with verse text from a verified canonical corpus.
                        </p>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" role="list" aria-label="Project metrics">
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                            <div className="text-xl font-bold text-emerald-500">13,828</div>
                            <div className="text-xs text-muted-foreground">Poems</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                            <div className="text-xl font-bold text-emerald-500">33,640</div>
                            <div className="text-xs text-muted-foreground">Dictionary Entries</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                            <div className="text-xl font-bold text-emerald-500">106,037</div>
                            <div className="text-xs text-muted-foreground">Searchable Verses</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                            <div className="text-xl font-bold text-emerald-500">128+</div>
                            <div className="text-xs text-muted-foreground">Test Functions</div>
                          </li>
                        </ul>
                        <ul className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Technologies used">
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Swift</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">SwiftUI</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">CoreData</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">NLP</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">iOS</Badge></li>
                        </ul>
                        {/* Impact */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <span className="text-emerald-500" aria-hidden="true">✓</span>
                          <span className="text-muted-foreground"><strong className="font-medium text-foreground">Impact:</strong> Only bilingual Farsi-English Persian poetry analysis app with verified canonical corpus</span>
                        </div>
                      </div>
                      <nav className="flex flex-row gap-2" aria-label="Project links">
                        <a href="https://trybayan.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 min-h-[44px] min-w-[44px] p-3 rounded-xl bg-muted/80 hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center group/btn hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5" aria-label="Visit Bayan website at trybayan.com" itemProp="url">
                          <Link className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </nav>
                    </div>
                  </Card>
                </article>
              </ScrollReveal>

              <ScrollReveal className="scroll-reveal-child">
                <article className="group relative project" itemScope itemType="https://schema.org/SoftwareSourceCode">
                  {/* Gradient glow on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500" />
                  
                  <Card className="relative p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:border-primary/40 bg-card overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors" itemProp="name">
                            Financial Intelligence Meta-Layer (FIML)
                          </h3>
                          <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 text-xs">Open Source</Badge>
                        </div>
                        <p className="text-foreground/80 mb-4 leading-relaxed" itemProp="description">
                          AI-native MCP server for financial data aggregation with intelligent multi-provider orchestration and multilingual compliance guardrails.
                        </p>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" role="list" aria-label="Project metrics">
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">32K+</div>
                            <div className="text-xs text-muted-foreground">Lines of Code</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">1,403</div>
                            <div className="text-xs text-muted-foreground">Automated Tests</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">100%</div>
                            <div className="text-xs text-muted-foreground">Pass Rate</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Phase 2</div>
                            <div className="text-xs text-muted-foreground">In Progress</div>
                          </li>
                        </ul>
                        <ul className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Technologies used" itemProp="programmingLanguage">
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Python</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">MCP Server</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">AI Orchestration</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Expo</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">CI/CD</Badge></li>
                        </ul>
                        {/* Client Story Snippet */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20 text-xs">
                          <span className="text-green-500" aria-hidden="true">✓</span>
                          <span className="text-muted-foreground"><strong className="font-medium text-foreground">Impact:</strong> Reduces financial data integration time by 70%</span>
                        </div>
                      </div>
                      <nav className="flex flex-row gap-2" aria-label="Project links">
                        <a href="https://kiarashplusplus.github.io/FIML/" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 min-h-[44px] min-w-[44px] p-3 rounded-xl bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center group/btn hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5" aria-label="View FIML project website" itemProp="url">
                          <Link className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </a>
                        <a href="https://github.com/kiarashplusplus/FIML" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 min-h-[44px] min-w-[44px] p-3 rounded-xl bg-muted/80 hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center group/btn hover:shadow-lg hover:-translate-y-0.5" aria-label="View FIML project on GitHub" itemProp="codeRepository">
                          <Github className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </nav>
                    </div>
                  </Card>
                </article>
              </ScrollReveal>

              <ScrollReveal className="scroll-reveal-child">
                <article className="group relative project" itemScope itemType="https://schema.org/SoftwareApplication">
                  {/* Gradient glow on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500" />
                  
                  <Card className="relative p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:border-blue-500/40 bg-card overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl md:text-2xl font-bold group-hover:text-blue-500 transition-colors" itemProp="name">
                            <a href="https://www.align-a.com/about" target="_blank" rel="noopener noreferrer" className="hover:underline">Aligna</a>
                          </h3>
                          <Badge variant="outline" className="border-blue-500/50 text-blue-600 bg-blue-500/10 text-xs" itemProp="applicationCategory">SaaS Platform</Badge>
                        </div>
                        <p className="text-foreground/80 mb-4 leading-relaxed" itemProp="description">
                          Conversational AI recruiter that schedules and conducts voice interviews via LiveKit, transcribes with Azure OpenAI, and performs automated candidate-job matching.
                        </p>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" role="list" aria-label="Project features">
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-blue-500/30 transition-colors">
                            <div className="text-xl font-bold text-blue-500">AI</div>
                            <div className="text-xs text-muted-foreground">Voice Interviews</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-blue-500/30 transition-colors">
                            <div className="text-xl font-bold text-blue-500">Built</div>
                            <div className="text-xs text-muted-foreground">a Production AI</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-blue-500/30 transition-colors">
                            <div className="text-xl font-bold text-blue-500">2-Way</div>
                            <div className="text-xs text-muted-foreground">Smart Matching</div>
                          </li>
                          <li className="text-center p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl border border-border/50 group-hover:border-blue-500/30 transition-colors">
                            <div className="text-xl font-bold text-blue-500">Full</div>
                            <div className="text-xs text-muted-foreground">Observability</div>
                          </li>
                        </ul>
                        <ul className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Technologies used">
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Next.js</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">LiveKit</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Azure OpenAI</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">PostgreSQL</Badge></li>
                          <li><Badge variant="secondary" className="text-xs bg-secondary/50">Docker</Badge></li>
                        </ul>
                        {/* Client Story Snippet */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
                          <span className="text-blue-500" aria-hidden="true">✓</span>
                          <span className="text-muted-foreground"><strong className="font-medium text-foreground">Impact:</strong> Helps startups cut hiring time with AI interviews</span>
                        </div>
                      </div>
                      <nav className="flex flex-row gap-2" aria-label="Project links">
                        <a href="https://www.align-a.com/about" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 min-h-[44px] min-w-[44px] p-3 rounded-xl bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center group/btn hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5" aria-label="View Aligna project website" itemProp="url">
                          <Link className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </nav>
                    </div>
                  </Card>
                </article>
              </ScrollReveal>
            </div>
          </ScrollRevealContainer>
        </div>
      </section>

      <SectionDivider variant="sparkle" />
      
      {/* SHARED CONTENT: Both modes see skills and below */}
      <section id="skills" className="py-16 px-6 md:py-20 scroll-mt-20 relative" tabIndex={-1} aria-labelledby="skills-heading">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollRevealContainer>
            <ScrollReveal className="scroll-reveal-child mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" aria-hidden="true" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Expertise</span>
              </div>
              <h2 id="skills-heading" className="text-3xl md:text-4xl font-bold mb-3">Technical Expertise</h2>
              <p className="text-muted-foreground">
                From AI/ML to full-stack development and engineering leadership
              </p>
            </ScrollReveal>

            <ScrollReveal className="scroll-reveal-child">
              <Suspense fallback={<SectionLoader height="h-[500px]" />}>
                <SkillsCharts />
              </Suspense>
            </ScrollReveal>
          </ScrollRevealContainer>
        </div>
      </section>

      <SectionDivider variant="ornate" />

      {/* Enhanced Technical Showcase Section - Only for visitors (developers see it first) */}
      {!isDeveloperMode && (
      <section id="showcase" className="py-16 px-6 md:py-20 scroll-mt-20 relative">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollRevealContainer>
            <ScrollReveal className="scroll-reveal-child mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Developer</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Developer Showcase</h2>
              <p className="text-muted-foreground">
                Interactive demonstrations of engineering capabilities and code quality
              </p>
            </ScrollReveal>

            {/* Engineering Metrics */}
            <ScrollReveal className="scroll-reveal-child mb-8">
              <Suspense fallback={<SectionLoader />}>
                <EngineeringMetrics />
              </Suspense>
            </ScrollReveal>

            {/* Tech Stack */}
            <ScrollReveal className="scroll-reveal-child mb-8">
              <Suspense fallback={<SectionLoader />}>
                <TechStack />
              </Suspense>
            </ScrollReveal>

            {/* GitHub Activity */}
            <ScrollReveal className="scroll-reveal-child mb-8">
              <Suspense fallback={<SectionLoader />}>
                <GitHubActivity />
              </Suspense>
            </ScrollReveal>

            {/* Interactive Terminal */}
            <ScrollReveal className="scroll-reveal-child" id="terminal">
              <div className="mb-4 text-center scroll-mt-20">
                <h3 className="text-xl font-bold mb-2">Interactive Terminal</h3>
                <p className="text-sm text-muted-foreground">
                  Explore my profile using familiar terminal commands
                </p>
              </div>
              <Suspense fallback={<SectionLoader height="h-96" />}>
                <TerminalSection />
              </Suspense>
            </ScrollReveal>
          </ScrollRevealContainer>
        </div>
      </section>
      )}

      <SectionDivider variant="gradient" />

      <section id="experience" className="py-16 px-6 md:py-20 scroll-mt-20 relative" aria-labelledby="experience-heading">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollRevealContainer>
            <ScrollReveal className="scroll-reveal-child flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" aria-hidden="true" />
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">Career</span>
                </div>
                <h2 id="experience-heading" className="text-3xl md:text-4xl font-bold mb-2">
                  <TextScramble 
                    text="Experience" 
                    scrambleOnMount={false}
                    scrambleOnView={true}
                    delay={200}
                  />
                </h2>
                <p className="text-muted-foreground">10+ years building AI systems at scale</p>
              </div>
              <MagneticButton 
                strength={0.35}
                radius={120}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/Kiarash-Adl-Resume.pdf'
                  link.download = 'Kiarash-Adl-Resume.pdf'
                  link.click()
                }}
              >
                <Download className="h-[18px] w-[18px]" />
                Resume (PDF)
              </MagneticButton>
            </ScrollReveal>

            <ScrollReveal className="scroll-reveal-child mb-10">
              <Suspense fallback={<SectionLoader height="h-96" />}>
                <InteractiveTimeline />
              </Suspense>
            </ScrollReveal>

            <ScrollReveal className="scroll-reveal-child grid md:grid-cols-2 gap-6">
              {/* Education */}
              <Card className="p-6 relative overflow-hidden group">
                {/* Decorative MIT-inspired gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-gray-500/5 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 relative z-10">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Education
                </h3>
                
                <div className="relative z-10 space-y-4">
                  {/* MIT Main Entry */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-gray-800 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        MIT
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">Massachusetts Institute of Technology</h4>
                      <p className="text-primary text-sm font-semibold">B.S. Electrical Engineering & Computer Science</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Cambridge, MA • Class of 2014</p>
                    </div>
                  </div>
                  
                  {/* Highlights */}
                  <div className="pl-16 space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"></span>
                      <span className="text-muted-foreground">Research at <span className="text-foreground font-medium">MIT CSAIL</span> - Computer Science & AI Laboratory</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                      <span className="text-muted-foreground">Focus: <span className="text-foreground font-medium">Machine Learning, GPU Computing, Systems</span></span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      <span className="text-muted-foreground">Published research achieving <span className="text-foreground font-medium">55x GPU speedup</span></span>
                    </div>
                  </div>
                  
                  {/* Skills badges */}
                  <div className="pl-16 flex flex-wrap gap-1.5 pt-1">
                    {["Algorithms", "ML/AI", "Systems", "Python"].map((skill) => (
                      <span key={skill} className="px-2 py-0.5 text-xs rounded-full bg-muted/60 text-muted-foreground border border-border/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Research Publications */}
              <Card className="p-6 relative overflow-hidden group">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 relative z-10">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Research Publications
                </h3>
                
                <div className="relative z-10 space-y-5">
                  {/* Feature Factory Paper */}
                  <a 
                    href="https://dl.acm.org/doi/abs/10.1145/2724660.2728696" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block space-y-2 p-3 -m-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group/paper"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md group-hover/paper:shadow-lg group-hover/paper:scale-105 transition-all duration-200">
                        L@S
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground leading-tight group-hover/paper:text-primary transition-colors">Feature Factory: Crowdsourced Feature Discovery</h4>
                        <p className="text-xs text-primary font-medium mt-0.5">ACM Learning @ Scale 2015</p>
                        <p className="text-xs text-muted-foreground">MIT CSAIL • Jan – May 2014</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-13 leading-relaxed">
                      Machine learning research on edX student activity data. Published in Proc. ACM L@S '15, pp. 373–376.
                    </p>
                  </a>
                  
                  {/* GPU Speech Recognition Paper */}
                  <a 
                    href="https://ieeexplore.ieee.org/abstract/document/6289085" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block space-y-2 p-3 -m-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group/paper"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md group-hover/paper:shadow-lg group-hover/paper:scale-105 transition-all duration-200">
                        IEEE
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground leading-tight group-hover/paper:text-primary transition-colors">Fast Spoken Query Detection Using GPU DTW</h4>
                        <p className="text-xs text-primary font-medium mt-0.5">IEEE ICASSP 2012 • Kyoto</p>
                        <p className="text-xs text-muted-foreground">MIT CSAIL • June 2011 – Jan 2012</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-13 leading-relaxed">
                      Achieved <span className="text-foreground font-medium">55x speedup</span> with novel GPU speech recognition. Published in Proc. ICASSP, pp. 5173–5176.
                    </p>
                  </a>
                </div>
                
                {/* Citation count hint */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Peer-reviewed & published in top-tier venues</span>
                </div>
              </Card>
            </ScrollReveal>
          </ScrollRevealContainer>
        </div>
      </section>

      <SectionDivider variant="constellation" />

      <section id="contact" className="py-16 px-6 md:py-20 scroll-mt-20 relative" tabIndex={-1} aria-labelledby="contact-heading">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollRevealContainer>
            <ScrollReveal className="scroll-reveal-child mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" aria-hidden="true" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Contact</span>
              </div>
              <h2 id="contact-heading" className="text-3xl md:text-4xl font-bold mb-2">
                I'm ready to collaborate!
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-5 gap-6 md:gap-8">
              <ScrollReveal className="scroll-reveal-child md:col-span-2 space-y-4">
                <a 
                  href="mailto:kiarasha@alum.mit.edu" 
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-muted/60 to-muted/30 hover:from-primary/10 hover:to-accent/5 rounded-2xl transition-all duration-300 group border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl group-hover:from-primary/30 group-hover:to-accent/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Email</div>
                    <div className="font-semibold group-hover:text-primary transition-colors">kiarasha@alum.mit.edu</div>
                  </div>
                </a>

                <a 
                  href="tel:+18579281608" 
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-muted/60 to-muted/30 hover:from-primary/10 hover:to-accent/5 rounded-2xl transition-all duration-300 group border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl group-hover:from-primary/30 group-hover:to-accent/20 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Phone</div>
                    <div className="font-semibold group-hover:text-primary transition-colors">+1-857-928-1608</div>
                  </div>
                </a>

                {/* Calendly - Schedule a Call */}
                <a 
                  href="https://calendly.com/kiarasha-alum/30min" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 rounded-2xl transition-all duration-300 group border border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
                >
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/20 transition-colors">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5 font-medium">Free 30-min call</div>
                    <div className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Schedule on Calendly</div>
                  </div>
                </a>

                <div className="flex gap-3 pt-2">
                  <a 
                    href="https://www.linkedin.com/in/kiarashadl/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-medium group"
                  >
                    <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    LinkedIn
                  </a>
                  <a 
                    href="https://github.com/kiarashplusplus/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-4 bg-foreground text-background rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-medium group"
                  >
                    <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    GitHub
                  </a>
                </div>
              </ScrollReveal>

              <ScrollReveal className="scroll-reveal-child md:col-span-3">
                <div className="relative group">
                  {/* Gradient glow effect - reduced blur for performance */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-500" />
                  
                  <Card className="relative p-8 bg-card border-border/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Send a Message</h3>
                        <p className="text-xs text-muted-foreground">I'll get back to you within 24 hours</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Name <span className="text-primary">*</span></Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-primary">*</span></Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="What's this about?"
                        value={formData.subject}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Message <span className="text-primary">*</span></Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell me about your project..."
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="resize-none rounded-xl border-border/50 focus:border-primary focus:ring-primary/20 focus:ring-[3px] transition-all duration-300 bg-background/50 hover:border-primary/30"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full gap-2 h-12 text-base"
                    >
                      <Send className="h-[18px] w-[18px]" />
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Card>
                </div>
              </ScrollReveal>
            </div>
          </ScrollRevealContainer>
        </div>
      </section>

      <SectionDivider variant="dots" />

      {/* Guestbook Section */}
      <section id="guestbook" className="py-16 px-6 md:py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <Suspense fallback={<SectionLoader />}>
              <Guestbook />
            </Suspense>
          </ScrollReveal>
        </div>
      </section>
      </main>

      <footer className="relative py-12 px-6 border-t border-border/30 overflow-hidden" role="contentinfo">
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col items-center gap-6">
            {/* Logo/Name */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                <GradientFlowText 
                  colors={["var(--primary)", "var(--accent)", "var(--primary)"]}
                  speed={4}
                >
                  Kiarash Adl
                </GradientFlowText>
              </h3>
              <p className="text-sm text-muted-foreground">
                <ElasticText>AI Systems Architect • MIT EECS '14</ElasticText>
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="https://www.linkedin.com/in/kiarashadl/" target="_blank" rel="noopener noreferrer" className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-muted/50 border border-border/30 hover:bg-primary hover:text-primary-foreground hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group" aria-label="Visit Kiarash's LinkedIn profile">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com/kiarashplusplus/" target="_blank" rel="noopener noreferrer" className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-muted/50 border border-border/30 hover:bg-foreground hover:text-background hover:border-foreground/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group" aria-label="Visit Kiarash's GitHub profile">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:kiarasha@alum.mit.edu" className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-muted/50 border border-border/30 hover:bg-accent hover:text-accent-foreground hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group" aria-label="Email Kiarash">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            
            {/* Divider */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {/* AI Agent Chat Button */}
            <AIAgentButton />
            
            {/* View Mode Switcher */}
            <button
              onClick={isDeveloperMode ? switchToVisitorMode : switchToDeveloperMode}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {isDeveloperMode ? (
                <>👀 Switch to regular view</>
              ) : (
                <>💻 Switch to developer view</>
              )}
            </button>
            
            {/* Bottom info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
              <p>© 2025 Kiarash Adl</p>
              <span className="hidden sm:flex items-center gap-1.5">
                Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border">?</kbd> for shortcuts
              </span>
            </div>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 min-h-[52px] min-w-[52px] p-3 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 z-40 animate-in fade-in zoom-in group"
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="h-6 w-6 relative z-10" />
        </button>
      )}

      {/* Keyboard Navigation */}
      <Suspense fallback={null}>
        <KeyboardHelp show={showHelp} onClose={() => setShowHelp(false)} />
      </Suspense>
    </div>
      )}
    </>
  )
}

export default App
