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
  const particlesRef = useRef<any[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 파티클 생성
    const createParticles = () => {
      const particles = []
      const particleCount = 400      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          size: Math.random() * spread + 1,
          opacity: particleTransparency ? Math.random() * 0.8 + 0.2 : 1,
          baseOpacity: particleTransparency ? Math.random() * 0.8 + 0.2 : 1
        })
      }
      return particles
    }

    particlesRef.current = createParticles()

    // 마우스 이벤트
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      }
    }

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const particles = particlesRef.current
      
      particles.forEach((particle, i) => {
        // 파티클 이동
        particle.x += particle.vx
        particle.y += particle.vy

        // 마우스 상호작용
        if (mouseInteraction) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < baseSize) {
            const force = (baseSize - distance) / baseSize
            particle.x -= dx * force * 0.01
            particle.y -= dy * force * 0.01
            particle.opacity = Math.min(1, particle.baseOpacity + force * 0.5)
          } else {
            particle.opacity = particle.baseOpacity
          }
        }

        // 경계 처리
        if (particle.x < 0 || particle.x > canvas.width) {          particle.vx *= -1
          particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -1
          particle.y = Math.max(0, Math.min(canvas.height, particle.y))
        }

        // 파티클 그리기
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        
        // 색상 적용
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`
        ctx.fill()

        // 연결선 그리기
        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              const lineOpacity = (100 - distance) / 100 * 0.2
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineOpacity})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // 클린업
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [color, mouseInteraction, particleTransparency, baseSize, spread, speed])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  )
}
