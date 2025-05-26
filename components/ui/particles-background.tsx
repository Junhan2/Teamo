"use client"

import { useEffect, useRef } from 'react'

interface ParticlesBackgroundProps {
  className?: string
}

export default function ParticlesBackground({ className = "" }: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 파티클 배열
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    // Canvas 크기 설정
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()

    // 파티클 생성
    const createParticles = () => {
      const count = 300
      particles.length = 0
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2
        })
      }
    }
    createParticles()

    // 애니메이션 함수
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 파티클 업데이트 및 그리기
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]
        
        // 위치 업데이트
        particle.x += particle.vx
        particle.y += particle.vy

        // 경계 처리
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // 경계 안에 유지
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // 파티클 그리기
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    // 리사이즈 핸들러
    const handleResize = () => {
      setCanvasSize()
      createParticles()
    }
    window.addEventListener('resize', handleResize)

    // 클린업
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
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
