'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ThemeSelector } from '../theme/ThemeSelector';
import {
  Activity,
  Radio,
  ShieldAlert,
  Globe2,
  Clock,
  History,
  BarChart3,
  Lightbulb,
  BookOpen,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

export function Navbar({ onRefresh, isRefreshing, lastUpdated }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Mission Control', icon: Activity },
    { href: '/live', label: 'Live Telemetry', icon: Radio },
    { href: '/risk', label: 'Risk Centre', icon: ShieldAlert },
    { href: '/magnetosphere', label: '3D Magnetosphere', icon: Globe2 },
    { href: '/forecasts', label: 'Multi-Horizon', icon: Clock },
    { href: '/replay', label: 'Storm Replay', icon: History },
    { href: '/performance', label: 'ML Observatory', icon: BarChart3 },
    { href: '/explainability', label: 'Explainable AI', icon: Lightbulb },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-md overflow-hidden border border-solar-500/40 bg-black/40 flex items-center justify-center p-0.5 group-hover:border-solar-400 transition-colors">
              <Image
                src="/images/logo.png"
                alt="HelioAlert Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider text-foreground group-hover:text-solar-400 transition-colors uppercase font-mono">
                  HELIOALERT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-solar-500/15 text-solar-400 border border-solar-500/30">
                  ML-v1.0
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline leading-none">
                Space-Weather Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                title="Refresh live NOAA feeds"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-solar-400' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>
            )}

            <ThemeSelector />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-md border border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header tagline & freshness banner */}
      <div className="bg-surface-elevated/60 border-t border-border/50 px-4 py-1 text-center text-[11px] text-muted-foreground flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-foreground hidden sm:inline">
            &ldquo;Will the Sun disturb Earth&apos;s magnetic field in the next few hours?&rdquo;
          </span>
          <span className="font-medium text-foreground sm:hidden">
            NOAA G1 Early Warning
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]">
            Target: <strong className="text-solar-400 font-mono">Kp ≥ 5.0 (NOAA G1)</strong>
          </span>
          {lastUpdated && (
            <span className="text-[10px] hidden md:inline">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-surface-elevated/98 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

