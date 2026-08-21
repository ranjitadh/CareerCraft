'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x06070a, 0.015)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    mount.appendChild(renderer.domElement)

    // 1. Particle Cloud
    const particleCount = 1200
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const colorCyan = new THREE.Color(0x00f0ff)
    const colorPurple = new THREE.Color(0x8a2be2)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80

      const mixedColor = colorCyan.clone().lerp(colorPurple, Math.random())
      colors[i * 3] = mixedColor.r
      colors[i * 3 + 1] = mixedColor.g
      colors[i * 3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // 2. Wireframe 3D Mesh Object (Floating Icosahedron)
    const meshGeometry = new THREE.IcosahedronGeometry(8, 2)
    const meshMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
    const wireframeMesh = new THREE.Mesh(meshGeometry, meshMaterial)
    scene.add(wireframeMesh)

    // Mouse Tracking
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Animation Loop
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Rotate particle system slowly
      particles.rotation.y += 0.0012
      particles.rotation.x += 0.0006

      // Rotate central 3D wireframe mesh
      wireframeMesh.rotation.x += 0.002
      wireframeMesh.rotation.y += 0.003

      // Smooth camera motion following mouse lerp
      camera.position.x += (mouseX * 4 - camera.position.x) * 0.04
      camera.position.y += (-mouseY * 4 - camera.position.y) * 0.04
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  )
}
