"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface ScrollAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
  threshold?: number
}

export function ScrollAnimation({ children, className = "", delay = 0, threshold = 0.1 }: Readonly<ScrollAnimationProps>) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin: "50px 0px -50px 0px",
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay, threshold])

  return (
    <div ref={ref} className={`animate-on-scroll ${isVisible ? "animate-in" : ""} ${className}`}>
      {children}
    </div>
  )
}

export function StaggeredAnimation({
  children,
  className = "",
  staggerDelay = 100,
}: Readonly<{
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}>) {
  return (
    <>
      {children.map((child, index) => (
        <ScrollAnimation key={`stagger-${index}-${typeof child === 'object' && child !== null && 'key' in child ? child.key : index}`} delay={index * staggerDelay} className={className}>
          {child}
        </ScrollAnimation>
      ))}
    </>
  )
}
