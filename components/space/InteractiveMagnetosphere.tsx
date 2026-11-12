'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';

const T: any = THREE;
import { RotateCw, ZoomIn, ZoomOut, Eye, Sparkles, AlertCircle } from 'lucide-react';

interface InteractiveMagnetosphereProps {
  speed?: number; // km/s
  bzGsm?: number; // nT
  density?: number; // p/cm³
  interactive?: boolean;
  height?: string;
}

export function InteractiveMagnetosphere({
  speed = 420.0,
  bzGsm = -1.2,
  density = 5.0,
  interactive = true,
  height = '500px'
}: InteractiveMagnetosphereProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isRotating, setIsRotating] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showParticles, setShowParticles] = useState(true);

  const isSouthward = bzGsm < 0;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const heightPx = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, width / heightPx, 0.1, 2000);
    camera.position.set(45, 25, 95);
    camera.lookAt(0, 0, 0);

    const renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting (Sunlight coming from +X axis)
    const sunLight = new T.DirectionalLight(0xfffaed, 2.8);
    sunLight.position.set(150, 10, 20);
    scene.add(sunLight);

    const ambientLight = new T.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    // 3. Central Earth Object
    const earthGroup = new T.Group();
    // Axial tilt of 23.4 degrees
    earthGroup.rotation.z = T.MathUtils.degToRad(-23.4);

    const earthRadius = 12;
    const earthGeom = new T.SphereGeometry(earthRadius, 64, 64);
    
    // Procedural Earth surface material with realistic blue oceans & green/brown continents
    const earthMat = new T.MeshStandardMaterial({
      color: 0x1e40af,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x0a192f,
      emissiveIntensity: 0.2
    });
    const earthMesh = new T.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

    // Atmospheric Glow Halo
    const atmoGeom = new T.SphereGeometry(earthRadius * 1.15, 32, 32);
    const atmoMat = new T.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: T.BackSide,
      blending: T.AdditiveBlending
    });
    const atmoMesh = new T.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmoMesh);

    scene.add(earthGroup);

    // 4. Dipole Geomagnetic Field Lines
    const fieldLinesGroup = new T.Group();
    
    const fieldLineColor = isSouthward ? 0xf59e0b : 0x38bdf8;
    const fieldLineMat = new T.LineBasicMaterial({
      color: fieldLineColor,
      transparent: true,
      opacity: 0.6,
      linewidth: 1.5
    });

    const L_values = [1.8, 2.4, 3.2, 4.2];
    const longitudes = 12;

    for (const L of L_values) {
      for (let j = 0; j < longitudes; j++) {
        const phi = (j / longitudes) * Math.PI * 2;
        const points: any[] = [];
        
        const thetaSteps = 40;
        for (let k = 0; k <= thetaSteps; k++) {
          const theta = (0.2 + (k / thetaSteps) * 2.74);
          let r = earthRadius * L * Math.sin(theta) * Math.sin(theta);
          
          const xBase = r * Math.sin(theta) * Math.cos(phi);
          const yBase = r * Math.cos(theta);
          const zBase = r * Math.sin(theta) * Math.sin(phi);

          const compression = xBase > 0 ? (isSouthward ? 0.75 : 0.85) : 1.35;
          const xFinal = xBase * compression;
          const yFinal = yBase;
          const zFinal = zBase;

          points.push(new T.Vector3(xFinal, yFinal, zFinal));
        }

        const curveGeom = new T.BufferGeometry().setFromPoints(points);
        const line = new T.Line(curveGeom, fieldLineMat);
        fieldLinesGroup.add(line);
      }
    }

    scene.add(fieldLinesGroup);

    // 5. Magnetopause Bow Shock Boundary
    const standoffDist = isSouthward ? 24 : 30;
    const bowShockGeom = new T.RingGeometry(standoffDist - 1, standoffDist + 2, 48, 1, Math.PI * 0.7, Math.PI * 0.6);
    const bowShockMat = new T.MeshBasicMaterial({
      color: isSouthward ? 0xef4444 : 0x06b6d4,
      transparent: true,
      opacity: 0.4,
      side: T.DoubleSide
    });
    const bowShockMesh = new T.Mesh(bowShockGeom, bowShockMat);
    bowShockMesh.rotation.y = Math.PI / 2;
    bowShockMesh.position.set(standoffDist * 0.5, 0, 0);
    scene.add(bowShockMesh);

    // 6. Incoming Solar Wind Particle Stream
    const particleCount = 600;
    const particleGeom = new T.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    const baseSpeed = Math.max(1.0, (speed / 300) * 1.5);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const x = 70 + Math.random() * 40;
      const y = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;

      particlePositions[idx] = x;
      particlePositions[idx + 1] = y;
      particlePositions[idx + 2] = z;

      particleVelocities.push({
        x: -baseSpeed * (0.8 + Math.random() * 0.4),
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1
      });
    }

    particleGeom.setAttribute('position', new T.BufferAttribute(particlePositions, 3));
    const particleMat = new T.PointsMaterial({
      color: isSouthward ? 0xf59e0b : 0x38bdf8,
      size: 2.2,
      transparent: true,
      opacity: 0.65,
      blending: T.AdditiveBlending
    });
    const particlePoints = new T.Points(particleGeom, particleMat);
    scene.add(particlePoints);

    // 7. Mouse Orbit Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      scene.rotation.y += deltaX * 0.008;
      scene.rotation.x += deltaY * 0.008;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z = Math.max(40, Math.min(180, camera.position.z + e.deltaY * 0.05));
    };

    if (interactive) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    // 8. Animation Loop
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);

      // Earth rotation
      if (isRotating) {
        earthMesh.rotation.y += 0.005;
      }

      // Propagate incoming solar wind particles
      if (showParticles) {
        const pos = particleGeom.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          pos[idx] += particleVelocities[i].x;
          pos[idx + 1] += particleVelocities[i].y;
          pos[idx + 2] += particleVelocities[i].z;

          // Deflect around bow shock
          if (pos[idx] < standoffDist && pos[idx] > -30) {
            const distFromAxis = Math.sqrt(pos[idx + 1] ** 2 + pos[idx + 2] ** 2);
            if (distFromAxis < standoffDist) {
              // Deflection away from Earth center
              pos[idx + 1] += (pos[idx + 1] >= 0 ? 0.8 : -0.8);
              pos[idx + 2] += (pos[idx + 2] >= 0 ? 0.8 : -0.8);
            }
          }

          // Reset particle when it passes Earth into the magnetotail
          if (pos[idx] < -70) {
            pos[idx] = 70 + Math.random() * 30;
            pos[idx + 1] = (Math.random() - 0.5) * 60;
            pos[idx + 2] = (Math.random() - 0.5) * 60;
          }
        }
        particleGeom.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeom.dispose();
      atmoGeom.dispose();
      particleGeom.dispose();
    };
  }, [speed, bzGsm, isSouthward, isRotating, showParticles, interactive]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-black/40 backdrop-blur-md" style={{ height }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Sun Direction Indicator (+X axis) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md border border-solar-500/30 bg-black/60 text-xs font-mono backdrop-blur-md text-solar-400">
        <Sparkles className="w-4 h-4 animate-spin text-solar-400" />
        <span>SUN DIRECTION (+X)</span>
      </div>

      {/* Live Measurement Reaction Badge */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg border border-border bg-surface-elevated/85 backdrop-blur-md max-w-sm space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-foreground flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-sky-400" />
            3D Magnetospheric Interaction
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            isSouthward ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
          }`}>
            {isSouthward ? 'RECONNECTION ACTIVE (Bz < 0)' : 'SHIELDED (Bz ≥ 0)'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {isSouthward
            ? `Southward Bz (${bzGsm.toFixed(1)} nT) allows interplanetary magnetic field lines to merge directly with Earth's dayside geomagnetic field, opening a conduit for solar wind energy transfer.`
            : `Northward Bz (+${bzGsm.toFixed(1)} nT) creates a closed magnetopause barrier that deflects the bulk of the solar wind around Earth.`}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/50">
          <span>Wind Speed: <strong className="text-foreground">{Math.round(speed)} km/s</strong></span>
          <span>Density: <strong className="text-foreground">{density.toFixed(1)} p/cm³</strong></span>
        </div>
      </div>

      {/* Interactive Controls Overlay */}
      {interactive && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 border border-border p-1 rounded-md backdrop-blur-md text-xs">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded transition-colors ${isRotating ? 'text-solar-400 bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
            title="Toggle Earth Rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-border mx-0.5" />
          <span className="text-[10px] text-muted-foreground px-1 hidden sm:inline font-mono">
            Drag to Rotate • Scroll to Zoom
          </span>
        </div>
      )}

      {/* Scientific Disclaimer Badge */}
      <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/75 font-mono hidden md:block">
        Conceptual 3D Visual Model • Not a live MHD simulation
      </div>
    </div>
  );
}
