"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Building2,
  Target,
  DollarSign,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  Database,
  Star,
  Activity,
  Globe,
  TrendingUp,
  Check,
  ChevronRight,
  PlayCircle,
  Clock,
  Briefcase,
  Sliders,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroBadgeRef = useRef<HTMLDivElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroMockupRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<HTMLDivElement>(null);

  // Interactive tab state for product preview
  const [activeTab, setActiveTab] = useState<
    "kanban" | "contacts" | "accounts" | "analytics"
  >("kanban");

  // ROI Calculator state
  const [teamSize, setTeamSize] = useState<number>(15);
  const [avgDealSize, setAvgDealSize] = useState<number>(12000);

  // Computed ROI metric
  const projectedSavings = Math.round(teamSize * 420); // Saved hours per year
  const projectedRevenueGain = Math.round((teamSize * avgDealSize * 0.18) / 1000); // $k gain

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 1 },
      });

      // Staggered entrance animation sequence
      tl.from(heroBadgeRef.current, { y: -30, opacity: 0, scale: 0.9 })
        .from(heroHeadingRef.current, { y: 40, opacity: 0 }, "-=0.6")
        .from(heroSubtitleRef.current, { y: 30, opacity: 0 }, "-=0.6")
        .from(heroCtaRef.current, { y: 20, opacity: 0, scale: 0.95 }, "-=0.5")
        .from(
          heroMockupRef.current,
          { y: 60, opacity: 0, scale: 0.92, duration: 1.2 },
          "-=0.4"
        );

      // Continuous floating physics animation on mockup frame
      gsap.to(heroMockupRef.current, {
        y: "-=12",
        repeat: -1,
        yoyo: true,
        ease: "sine.easeInOut",
        duration: 3.5,
      });

      // Feature cards staggered reveal animation
      if (featureCardsRef.current) {
        gsap.from(featureCardsRef.current.children, {
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden relative"
    >
      {/* Dynamic Animated Ambient Light Orbs & Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-grid-pattern opacity-60">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px] animate-pulse" />
        <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] rounded-full bg-purple-600/20 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[5%] w-[650px] h-[650px] rounded-full bg-emerald-500/15 blur-[170px] animate-pulse" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg shadow-primary/25 border border-white/20">
              IC
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              IC CRM
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
              v2.5 Enterprise
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-primary transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#showcase"
              className="hover:text-primary transition-colors"
            >
              Platform Tour
            </a>
            <a
              href="#metrics"
              className="hover:text-primary transition-colors"
            >
              Metrics
            </a>
            <a href="#roi" className="hover:text-primary transition-colors">
              ROI Calculator
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Hero Badge */}
          <div
            ref={heroBadgeRef}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>Next-Gen Fullstack PostgreSQL SaaS Suite</span>
          </div>

          {/* Headline */}
          <h1
            ref={heroHeadingRef}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]"
          >
            Scale High-Velocity Deals with{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              IC CRM Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p
            ref={heroSubtitleRef}
            className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Unified enterprise pipeline manager for contacts, corporate accounts, qualified sales leads, Kanban deals, and team tasks powered by Next.js 15 & PostgreSQL.
          </p>

          {/* CTAs */}
          <div
            ref={heroCtaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Open Dashboard Live</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card text-foreground font-semibold text-sm hover:bg-accent border border-border shadow-md transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              Create Free Workspace
            </Link>
          </div>

          {/* Interactive Hero Preview Frame */}
          <div
            ref={heroMockupRef}
            className="pt-12 max-w-5xl mx-auto"
            suppressHydrationWarning
          >
            <div
              className="relative rounded-3xl border border-border/80 bg-card/60 backdrop-blur-2xl shadow-2xl p-3 md:p-6 transition-all hover:border-primary/50 duration-500 group"
              suppressHydrationWarning
            >
              {/* Header Bar Mockup */}
              <div className="flex items-center justify-between px-4 pb-4 border-b border-border/50 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-4 py-1 rounded-full border border-border/40">
                  https://app.iccrm.com/dashboard/pipeline
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-semibold text-emerald-500">Live Sync</span>
                </div>
              </div>

              {/* Main Screenshot Graphic */}
              <div className="rounded-2xl overflow-hidden border border-border/80 relative">
                <Image
                  src="/hero-glass.png"
                  alt="IC CRM Advanced GSAP Interface"
                  width={1200}
                  height={675}
                  priority
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                />

                {/* Floating Micro-Widget 1 */}
                <div className="absolute top-6 left-6 hidden md:flex items-center gap-3.5 p-3.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl text-xs animate-float-slow">
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-500 font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-foreground text-sm">$485,200</p>
                    <p className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +28.4% this quarter
                    </p>
                  </div>
                </div>

                {/* Floating Micro-Widget 2 */}
                <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-3.5 p-3.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl text-xs">
                  <div className="p-2.5 rounded-lg bg-primary/15 text-primary font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-foreground text-xs">PostgreSQL DB Engine</p>
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100% Operational & Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Impact Metrics Band */}
      <section id="metrics" className="py-12 bg-card/40 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-black text-foreground tracking-tight">$450M+</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Pipeline Value Closed</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-black text-primary tracking-tight">99.99%</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">PostgreSQL Uptime SLA</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-black text-indigo-500 tracking-tight">10x</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Faster Lead Conversion</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-black text-emerald-500 tracking-tight">50,000+</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Active Sales Ops Users</p>
          </div>
        </div>
      </section>

      {/* Feature Grid Capabilities */}
      <section
        id="features"
        className="py-24 px-6 relative"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Full-Spectrum CRM Features</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              Everything Your Sales Team Needs
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Engineered with enterprise modularity so reps spend less time updating spreadsheets and more time closing high-value deals.
            </p>
          </div>

          <div
            ref={featureCardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Users,
                color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                title: "Contact Directory",
                desc: "Unified customer records, secondary emails, mobile phone channels, and linked corporate accounts.",
              },
              {
                icon: Building2,
                color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
                title: "Account Intelligence",
                desc: "Organize enterprise accounts, industry classifications, employee headcounts, and executive profiles.",
              },
              {
                icon: Target,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                title: "Lead Management",
                desc: "Qualify inbound prospects, track acquisition channels, set lead scores, and assign deal owners.",
              },
              {
                icon: DollarSign,
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                title: "Kanban Pipeline",
                desc: "Drag-and-drop opportunity cards across custom stages from Prospecting to Closed Won.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-7 bg-card/80 border border-border/80 rounded-2xl space-y-4 shadow-sm hover:border-primary/50 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color} group-hover:scale-110 transition-transform`}
                >
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl text-foreground">
                  {feat.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tabbed Product Tour */}
      <section id="showcase" className="py-20 bg-secondary/30 border-y border-border/60 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Explore Platform Capabilities
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Click through interactive modules to see how IC CRM accelerates revenue workflows.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { id: "kanban", label: "Kanban Deals", icon: DollarSign },
              { id: "contacts", label: "Contact Hub", icon: Users },
              { id: "accounts", label: "Enterprise Accounts", icon: Building2 },
              { id: "analytics", label: "Revenue Analytics", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Card View */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-10 shadow-2xl max-w-5xl mx-auto min-h-[380px] flex flex-col justify-between">
            {activeTab === "kanban" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Visual Kanban Sales Stages</h3>
                    <p className="text-xs text-muted-foreground mt-1">Real-time drag and drop deal stage transitions with auto revenue calculation.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                    Active Pipeline: $1.42M
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prospecting (3)</p>
                    <div className="p-3 bg-card rounded-lg border border-border shadow-xs space-y-1">
                      <p className="font-bold text-xs text-foreground">Acme Corp Expansion</p>
                      <p className="text-[11px] text-emerald-500 font-semibold">$85,000 • 70% Probability</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Proposal Sent (2)</p>
                    <div className="p-3 bg-card rounded-lg border border-primary/40 shadow-xs space-y-1">
                      <p className="font-bold text-xs text-foreground">Global Tech Licensing</p>
                      <p className="text-[11px] text-emerald-500 font-semibold">$140,000 • 85% Probability</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Closed Won (5)</p>
                    <div className="p-3 bg-card rounded-lg border border-emerald-500/40 shadow-xs space-y-1">
                      <p className="font-bold text-xs text-foreground">Starlight Enterprise</p>
                      <p className="text-[11px] text-emerald-500 font-semibold">$220,000 • Closed Today</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border/60 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Enriched Contact Directory</h3>
                    <p className="text-xs text-muted-foreground mt-1">360-degree customer records with instant email channels & activity timelines.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    2,450 Verified Contacts
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Sarah Jenkins", role: "VP of Engineering", company: "Starlight SaaS", email: "sarah@starlight.io" },
                    { name: "Marcus Vance", role: "Head of Procurement", company: "Apex Logistics", email: "marcus@apex.com" },
                    { name: "Elena Rostova", role: "Chief Revenue Officer", company: "Nexus Financial", email: "elena@nexus.com" },
                  ].map((item) => (
                    <div key={item.email} className="p-3 bg-secondary/40 rounded-xl border border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.role} @ {item.company}</p>
                        </div>
                      </div>
                      <span className="text-muted-foreground font-mono">{item.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "accounts" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border/60 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">B2B Account Management</h3>
                    <p className="text-xs text-muted-foreground mt-1">Group deals, contacts, and custom attributes under parent corporate profiles.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/40 rounded-xl border border-border space-y-2">
                    <p className="font-bold text-sm text-foreground">Horizon Cloud Solutions</p>
                    <p className="text-xs text-muted-foreground">Industry: Cloud Infrastructure • 500-1000 Employees</p>
                    <p className="text-xs text-emerald-500 font-semibold">Total ARR: $380,000</p>
                  </div>
                  <div className="p-4 bg-secondary/40 rounded-xl border border-border space-y-2">
                    <p className="font-bold text-sm text-foreground">Vanguard Financial Group</p>
                    <p className="text-xs text-muted-foreground">Industry: Fintech • 2000+ Employees</p>
                    <p className="text-xs text-emerald-500 font-semibold">Total ARR: $620,000</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border/60 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Real-Time Forecasts & Insights</h3>
                    <p className="text-xs text-muted-foreground mt-1">Predictive close metrics and team performance breakdown.</p>
                  </div>
                </div>
                <div className="p-6 bg-secondary/30 rounded-2xl border border-border flex items-center justify-around text-center">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Win Rate</p>
                    <p className="text-3xl font-black text-emerald-500 mt-1">68.4%</p>
                  </div>
                  <div className="h-10 w-[1px] bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Avg Sales Cycle</p>
                    <p className="text-3xl font-black text-primary mt-1">18 Days</p>
                  </div>
                  <div className="h-10 w-[1px] bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Q3 Forecast</p>
                    <p className="text-3xl font-black text-purple-500 mt-1">$2.8M</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive ROI Estimator */}
      <section id="roi" className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-card via-card to-secondary/50 border border-border/80 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive ROI Estimator</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">Calculate Your Team Growth</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Adjust team parameters to estimate productivity hours saved and new revenue unlocked.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Controls */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Sales Team Reps:</span>
                  <span className="text-primary font-mono text-sm">{teamSize} Reps</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Average Deal Value ($):</span>
                  <span className="text-emerald-500 font-mono text-sm">${avgDealSize.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={avgDealSize}
                  onChange={(e) => setAvgDealSize(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Results Output */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Annual Time Saved</p>
                <p className="text-3xl font-black text-primary mt-1">{projectedSavings.toLocaleString()} Hours / year</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Projected Revenue Pipeline Lift</p>
                <p className="text-3xl font-black text-emerald-500 mt-1">+${projectedRevenueGain.toLocaleString()}k ARR</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Architecture */}
      <section id="architecture" className="py-20 bg-secondary/20 border-y border-border/60 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-black text-foreground">
              Production-Grade Full-Stack Engine
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
              Decoupled architecture built for enterprise security, sub-millisecond database queries, and complete scalability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Next.js 15</h4>
              <p className="text-[11px] text-muted-foreground">App Router & RSC</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all space-y-2">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 mx-auto flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">TypeScript</h4>
              <p className="text-[11px] text-muted-foreground">End-to-End Type Safety</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">PostgreSQL</h4>
              <p className="text-[11px] text-muted-foreground">Relational Core DB</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Prisma ORM</h4>
              <p className="text-[11px] text-muted-foreground">Schema Migrations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-foreground">Transparent Plans for Any Scale</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">Start free and scale seamlessly as your team revenue grows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="p-8 bg-card border border-border rounded-3xl space-y-6 flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="space-y-4">
                <h3 className="font-extrabold text-xl text-foreground">Starter Workspace</h3>
                <p className="text-xs text-muted-foreground">Perfect for early stage startups organizing initial sales pipelines.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Up to 3 Sales Reps</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 500 Contact Records</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Visual Kanban Board</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-3 rounded-xl bg-secondary text-foreground font-bold text-xs text-center border border-border hover:bg-accent transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Growth Pro */}
            <div className="p-8 bg-card border-2 border-primary rounded-3xl space-y-6 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold tracking-wider uppercase">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="font-extrabold text-xl text-foreground">Growth Professional</h3>
                <p className="text-xs text-muted-foreground">Designed for high-growth B2B revenue teams needing automated pipelines.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">$49</span>
                  <span className="text-xs text-muted-foreground">/ seat / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Contacts & Deals</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Multi-Pipeline Kanban</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Role-Based Access Control</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Priority PostgreSQL Backups</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors">
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 bg-card border border-border rounded-3xl space-y-6 flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="space-y-4">
                <h3 className="font-extrabold text-xl text-foreground">Enterprise Dedicated</h3>
                <p className="text-xs text-muted-foreground">Custom dedicated database clusters & SLA support for large organizations.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">Custom</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Isolated PostgreSQL Instance</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> SAML SSO & Audit Logs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 24/7 Dedicated Account Rep</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-3 rounded-xl bg-secondary text-foreground font-bold text-xs text-center border border-border hover:bg-accent transition-colors">
                Contact Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 text-xs text-muted-foreground bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-xs shadow-md shadow-primary/20">
              IC
            </div>
            <span className="font-bold text-foreground text-sm">IC CRM Platform</span>
            <span>© 2026 Enterprise SaaS Foundation</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#metrics" className="hover:text-foreground transition-colors">Metrics</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
