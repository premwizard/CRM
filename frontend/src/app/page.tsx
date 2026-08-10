"use client";

import React, { useRef } from "react";
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
          "-=0.4",
        );

      // Continuous floating physics animation on mockup frame
      gsap.to(heroMockupRef.current, {
        y: "-=15",
        repeat: -1,
        yoyo: true,
        ease: "sine.easeInOut",
        duration: 3.5,
      });

      // Feature cards staggered reveal animation
      if (featureCardsRef.current) {
        gsap.from(featureCardsRef.current.children, {
          y: 50,
          opacity: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: featureCardsRef.current,
            start: "top 80%",
          },
        });
      }
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden"
    >
      {/* Dynamic Animated Ambient Light Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/30 blur-[140px] animate-pulse" />
        <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] rounded-full bg-purple-600/25 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[5%] w-[650px] h-[650px] rounded-full bg-emerald-500/20 blur-[170px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md shadow-primary/25">
              IC
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              IC CRM
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#metrics"
              className="hover:text-foreground transition-colors"
            >
              Metrics
            </a>
            <a
              href="#architecture"
              className="hover:text-foreground transition-colors"
            >
              Tech Stack
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-md shadow-primary/25 flex items-center gap-2 group"
            >
              <span>Open App</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* GSAP Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div
            ref={heroBadgeRef}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-primary/30 text-xs font-semibold text-foreground shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>GSAP Powered Enterprise CRM Suite</span>
          </div>

          {/* Headline */}
          <h1
            ref={heroHeadingRef}
            className="text-4xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]"
          >
            Accelerate Revenue Pipelines with{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              IC CRM
            </span>
          </h1>

          {/* Subtitle */}
          <p
            ref={heroSubtitleRef}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Unify your enterprise contacts, corporate accounts, qualified leads,
            sales pipeline deals, and team tasks into one powerful PostgreSQL
            SaaS workspace.
          </p>

          {/* CTAs */}
          <div
            ref={heroCtaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Launch Live App</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-accent border border-border transition-all hover:scale-105"
            >
              Create Account
            </Link>
          </div>

          {/* Mockup Frame */}
          <div
            ref={heroMockupRef}
            className="pt-12 max-w-5xl mx-auto"
            suppressHydrationWarning
          >
            <div
              className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl p-3 md:p-5 transition-all hover:border-primary/50 duration-500"
              suppressHydrationWarning
            >
              <div
                className="rounded-xl overflow-hidden border border-border/80 relative group"
                suppressHydrationWarning
              >
                <Image
                  src="/hero-glass.png"
                  alt="IC CRM Advanced GSAP Interface"
                  width={1200}
                  height={675}
                  priority
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />

                {/* Animated Widget 1 */}
                <div className="absolute top-6 left-6 hidden md:flex items-center gap-3 p-3 bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-xl text-xs animate-pulse">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">$452,000</p>
                    <p className="text-[10px] text-muted-foreground">
                      Pipeline Value Won
                    </p>
                  </div>
                </div>

                {/* Animated Widget 2 */}
                <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-3 p-3 bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-xl text-xs animate-bounce">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      PostgreSQL & Prisma
                    </p>
                    <p className="text-[10px] text-emerald-500 font-semibold">
                      100% Verified Healthy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section
        id="features"
        className="py-20 bg-secondary/20 border-y border-border/60 px-6"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Comprehensive CRM Capability
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Engineered with enterprise SaaS architecture for speed,
              responsiveness, and scale.
            </p>
          </div>

          <div
            ref={featureCardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Users,
                color: "text-blue-500 bg-blue-500/10",
                title: "Contact Directory",
                desc: "Manage customer records, email channels, phone numbers, and company links.",
              },
              {
                icon: Building2,
                color: "text-purple-500 bg-purple-500/10",
                title: "Account Profiles",
                desc: "Organize B2B companies, industry verticals, domain links, and deal histories.",
              },
              {
                icon: Target,
                color: "text-amber-500 bg-amber-500/10",
                title: "Lead Pipeline",
                desc: "Track qualified prospects, lead sources, valuations, and conversion statuses.",
              },
              {
                icon: DollarSign,
                color: "text-emerald-500 bg-emerald-500/10",
                title: "Deals & Revenue",
                desc: "Kanban stages from proposal to won/lost with expected close date forecasting.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-6 bg-card border border-border rounded-xl space-y-3 shadow-xs hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${feat.color}`}
                >
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">
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

      {/* Tech Stack Banner */}
      <section id="architecture" className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              Production-Ready Full-Stack Architecture
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Separated frontend and backend layers engineered for extreme
              scalability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/60 hover:border-primary/40 transition-colors">
              <h4 className="font-bold text-foreground text-sm">Next.js 15</h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                App Router & RSC
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/60 hover:border-primary/40 transition-colors">
              <h4 className="font-bold text-foreground text-sm">TypeScript</h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                End-to-End Type Safety
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/60 hover:border-primary/40 transition-colors">
              <h4 className="font-bold text-foreground text-sm">PostgreSQL</h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                Relational Database
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/60 hover:border-primary/40 transition-colors">
              <h4 className="font-bold text-foreground text-sm">Prisma ORM</h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                Migrations & Client
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              IC
            </div>
            <span className="font-bold text-foreground">IC CRM</span>
            <span>© 2026 Enterprise SaaS Foundation</span>
          </div>
          <p>Enhanced with GSAP Animations & Next.js 15</p>
        </div>
      </footer>
    </div>
  );
}
