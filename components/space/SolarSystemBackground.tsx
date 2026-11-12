'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';

const T: any = THREE;

export function SolarSystemBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    // Media query for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene setup
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 180, 520);
    camera.lookAt(0, 0, 0);

    const renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: window.innerWidth > 768,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Light sources
    const ambientLight = new T.AmbientLight(0x223355, 0.8);
    scene.add(ambientLight);

    const sunLight = new T.PointLight(0xffeedd, 3.5, 2000, 0.4);
    sunLight.position.set(-180, 0, 0);
    scene.add(sunLight);

    // 1. Sun (The Visual Anchor)
    const sunGroup = new T.Group();
    sunGroup.position.set(-200, 20, 0);

    // Sun core
    const sunGeom = new T.SphereGeometry(38, 32, 32);
    const sunMat = new T.MeshBasicMaterial({
      color: 0xffaa11,
      wireframe: false
    });
    const sunMesh = new T.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Sun inner glow
    const innerGlowGeom = new T.SphereGeometry(44, 32, 32);
    const innerGlowMat = new T.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.35,
      side: T.BackSide
    });
    const innerGlow = new T.Mesh(innerGlowGeom, innerGlowMat);
    sunGroup.add(innerGlow);

    // Sun outer corona
    const outerCoronaGeom = new T.SphereGeometry(58, 32, 32);
    const outerCoronaMat = new T.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.15,
      side: T.BackSide
    });
    const outerCorona = new T.Mesh(outerCoronaGeom, outerCoronaMat);
    sunGroup.add(outerCorona);

    scene.add(sunGroup);

    // 2. Planets & Orbits
    // Earth Group
    const earthOrbitRadius = 320;
    const earthGroup = new T.Group();
    
    // Earth Sphere
    const earthGeom = new T.SphereGeometry(14, 32, 32);
    const earthMat = new T.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x051937,
      emissiveIntensity: 0.4
    });
    const earthMesh = new T.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

    // Earth atmospheric halo
    const atmoGeom = new T.SphereGeometry(16, 32, 32);
    const atmoMat = new T.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      side: T.BackSide
    });
    const atmoMesh = new T.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmoMesh);

    // Earth Magnetosphere Bow Shock curve representation (parabolic bow shock facing sun)
    const bowShockGeom = new T.RingGeometry(22, 26, 32, 1, Math.PI * 0.75, Math.PI * 0.5);
    const bowShockMat = new T.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      side: T.DoubleSide
    });
    const bowShock = new T.Mesh(bowShockGeom, bowShockMat);
    bowShock.rotation.y = Math.PI / 2;
    bowShock.position.set(-6, 0, 0);
    earthGroup.add(bowShock);

    // Earth Dipole field lines representation (subtle toroids)
    const fieldLineGeom = new T.TorusGeometry(19, 0.4, 8, 32, Math.PI * 1.5);
    const fieldLineMat = new T.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.25
    });
    const fieldLine1 = new T.Mesh(fieldLineGeom, fieldLineMat);
    fieldLine1.rotation.x = Math.PI / 2;
    earthGroup.add(fieldLine1);

    scene.add(earthGroup);

    // Venus
    const venusOrbitRadius = 220;
    const venusGeom = new T.SphereGeometry(9, 24, 24);
    const venusMat = new T.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.8
    });
    const venusMesh = new T.Mesh(venusGeom, venusMat);
    scene.add(venusMesh);

    // Mars
    const marsOrbitRadius = 420;
    const marsGeom = new T.SphereGeometry(8, 24, 24);
    const marsMat = new T.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.9
    });
    const marsMesh = new T.Mesh(marsGeom, marsMat);
    scene.add(marsMesh);

    // Orbit paths (faint ellipses)
    function createOrbitRing(radius: number) {
      const curve = new T.EllipseCurve(
        -200, 20, // center at sun
        radius, radius * 0.88, // xRadius, yRadius
        0, 2 * Math.PI,
        false,
        0
      );
      const points: any[] = curve.getPoints(100);
      const geom = new T.BufferGeometry().setFromPoints(
        points.map((p: any) => new T.Vector3(p.x, 0, p.y))
      );
      const mat = new T.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.08
      });
      return new T.Line(geom, mat);
    }

    const venusOrbit = createOrbitRing(venusOrbitRadius);
    const earthOrbit = createOrbitRing(earthOrbitRadius);
    const marsOrbit = createOrbitRing(marsOrbitRadius);
    scene.add(venusOrbit);
    scene.add(earthOrbit);
    scene.add(marsOrbit);

    // 3. Starfield (Two layers for depth)
    const starCount = window.innerWidth > 768 ? 900 : 400;
    const starGeom = new T.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2200;
      starPositions[i + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i + 2] = (Math.random() - 0.5) * 1400 - 300;
    }
    starGeom.setAttribute('position', new T.BufferAttribute(starPositions, 3));
    const starMat = new T.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.65
    });
    const starField = new T.Points(starGeom, starMat);
    scene.add(starField);

    // 4. Solar Wind Stream Particles (Flowing outwards from Sun towards Earth)
    const windCount = window.innerWidth > 768 ? 400 : 150;
    const windGeom = new T.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windVelocities: { x: number; y: number; z: number; startX: number; startY: number; startZ: number }[] = [];

    for (let i = 0; i < windCount; i++) {
      const idx = i * 3;
      // Start near sun
      const angle = (Math.random() - 0.5) * 0.9; // cone towards +X
      const dist = 50 + Math.random() * 500;
      const x = -200 + Math.cos(angle) * dist;
      const y = 20 + (Math.random() - 0.5) * 80;
      const z = Math.sin(angle) * dist;

      windPositions[idx] = x;
      windPositions[idx + 1] = y;
      windPositions[idx + 2] = z;

      windVelocities.push({
        x: (1.5 + Math.random() * 2.0) * Math.cos(angle),
        y: (Math.random() - 0.5) * 0.4,
        z: (1.5 + Math.random() * 2.0) * Math.sin(angle),
        startX: -200,
        startY: 20,
        startZ: 0
      });
    }

    windGeom.setAttribute('position', new T.BufferAttribute(windPositions, 3));
    const windMat = new T.PointsMaterial({
      color: 0xf59e0b,
      size: 2.2,
      transparent: true,
      opacity: 0.45,
      blending: T.AdditiveBlending
    });
    const solarWindPoints = new T.Points(windGeom, windMat);
    scene.add(solarWindPoints);

    // Animation Loop
    let animationFrameId: number;
    let isVisible = true;
    let clock = new T.Clock();

    function handleVisibilityChange() {
      isVisible = document.visibilityState === 'visible';
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let earthAngle = 0.35;
    let venusAngle = 1.2;
    let marsAngle = 3.8;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const speedFactor = prefersReducedMotion ? 0.1 : 1.0;

      // Sun rotation & subtle pulse
      sunGroup.rotation.y += 0.003 * speedFactor;
      const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 1.5) * 0.03;
      outerCorona.scale.set(pulse, pulse, pulse);

      // Earth orbit & rotation
      earthAngle += 0.0018 * speedFactor;
      const ex = -200 + Math.cos(earthAngle) * earthOrbitRadius;
      const ez = Math.sin(earthAngle) * (earthOrbitRadius * 0.88);
      earthGroup.position.set(ex, 10, ez);
      earthMesh.rotation.y += 0.01 * speedFactor;

      // Venus orbit
      venusAngle += 0.0028 * speedFactor;
      venusMesh.position.set(
        -200 + Math.cos(venusAngle) * venusOrbitRadius,
        15,
        Math.sin(venusAngle) * (venusOrbitRadius * 0.88)
      );

      // Mars orbit
      marsAngle += 0.0012 * speedFactor;
      marsMesh.position.set(
        -200 + Math.cos(marsAngle) * marsOrbitRadius,
        5,
        Math.sin(marsAngle) * (marsOrbitRadius * 0.88)
      );

      // Solar Wind particles propagation
      const positions = windGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < windCount; i++) {
        const idx = i * 3;
        const v = windVelocities[i];

        positions[idx] += v.x * (prefersReducedMotion ? 0.3 : 1.2);
        positions[idx + 1] += v.y;
        positions[idx + 2] += v.z * (prefersReducedMotion ? 0.3 : 1.2);

        // Reset particle if it travels too far
        if (positions[idx] > 400 || Math.abs(positions[idx + 2]) > 350) {
          positions[idx] = v.startX + (Math.random() - 0.5) * 20;
          positions[idx + 1] = v.startY + (Math.random() - 0.5) * 20;
          positions[idx + 2] = v.startZ + (Math.random() - 0.5) * 20;
        }
      }
      windGeom.attributes.position.needsUpdate = true;

      // Render
      renderer.render(scene, camera);
    }

    animate();

    // Window resize handler
    function handleResize() {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sunGeom.dispose();
      earthGeom.dispose();
      starGeom.dispose();
      windGeom.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none overflow-hidden transition-opacity duration-700"
      style={{
        zIndex: -1,
        opacity: theme === 'light' ? 0.35 : theme === 'medium' ? 0.55 : 0.85
      }}
      aria-hidden="true"
    >
      {!webglSupported && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#060b19] via-[#09152e] to-[#040813]" />
      )}
      {/* Subtle vignette layer to ensure foreground text contrast in all modes */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'light'
            ? 'radial-gradient(circle at 50% 40%, rgba(244, 246, 250, 0.4) 0%, rgba(244, 246, 250, 0.85) 100%)'
            : theme === 'medium'
            ? 'radial-gradient(circle at 50% 40%, rgba(24, 34, 52, 0.3) 0%, rgba(24, 34, 52, 0.8) 100%)'
            : 'radial-gradient(circle at 50% 40%, rgba(6, 11, 25, 0.2) 0%, rgba(6, 11, 25, 0.85) 100%)'
        }}
      />
    </div>
  );
}
