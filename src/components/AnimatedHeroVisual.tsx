import { memo, useRef, useEffect, useState, useCallback } from "react"
import profileImage from "@/assets/images/profile-384w.avif"

interface AnimatedHeroVisualProps {
  prefersReducedMotion?: boolean
}

export const AnimatedHeroVisual = memo(function AnimatedHeroVisual({ 
  prefersReducedMotion = false 
}: AnimatedHeroVisualProps) {
  return (
    <div 
      className="relative w-56 h-56 md:w-64 md:h-64 flex-shrink-0"
    >
      {/* Outer glow ring - static gradient, no animation */}
      <div
        className="absolute -inset-4 rounded-full opacity-20"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), #8b5cf6, hsl(var(--primary)))",
        }}
      />

      {/* Main container with profile image */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
      >
        <img 
          src={profileImage} 
          alt="Kiarash Adl"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </div>

      {/* Border ring */}
      <div 
        className="absolute inset-0 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
      />
      
      {/* Status indicator - static green dot, no ping animation */}
      <div className="absolute bottom-2 right-2 flex items-center justify-center">
        <span className="relative flex h-4 w-4">
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-background"></span>
        </span>
      </div>
    </div>
  )
})

export default AnimatedHeroVisual
