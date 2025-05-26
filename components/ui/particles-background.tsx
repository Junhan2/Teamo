"use client"

import { useEffect, useRef } from 'react'

interface ParticlesBackgroundProps {
  color?: string
  mouseInteraction?: boolean
  particleTransparency?: boolean
  baseSize?: number
  spread?: number
  speed?: number
  className?: string
}

export default function ParticlesBackground({
  color = "#ffffff",
  mouseInteraction = true,
  particleTransparency = true,
  baseSize = 200,
  spread = 10,
  speed = 0.1,
  className = ""
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 간단한 파티클 시스템
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    // Canvas 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 파티클 생성
    const createParticles = () => {
      particles.length = 0 // 배열 초기화
      const count = 300
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          size: Math.random() * 3 + 1,
          opacity: particleTransparency ? Math.random() * 0.8 + 0.2 : 1
        })
      }
    }

    createParticles()

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        // 파티클 이동
        particle.x += particle.vx
        particle.y += particle.vy

        // 경계 처리
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -1
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -1
        }

        // 파티클 그리기
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // 클린업
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  )
}
