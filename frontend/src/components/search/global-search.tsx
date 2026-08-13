"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Building2,
  Target,
  Briefcase,
  CheckSquare,
  Activity,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import { SearchResultItem } from "@/app/api/v1/search/route";

interface GroupedResults {
  contacts: SearchResultItem[];
  companies: SearchResultItem[];
  leads: SearchResultItem[];
  deals: SearchResultItem[];
  tasks: SearchResultItem[];
  activities: SearchResultItem[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GroupedResults>({
    contacts: [],
    companies: [],
    leads: [],
    deals: [],
    tasks: [],
    activities: [],
  });
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced Search API Call
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({
        contacts: [],
        companies: [],
        leads: [],
        deals: [],
        tasks: [],
        activities: [],
      });
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setResults(data.data.results);
          setTotalCount(data.data.totalCount || 0);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click Outside to Close Listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Flatten all items into a single array for keyboard arrow navigation
  const allItems: SearchResultItem[] = [
    ...results.contacts,
    ...results.companies,
    ...results.leads,
    ...results.deals,
    ...results.tasks,
    ...results.activities,
  ];

  const handleSelectResult = useCallback(
    (url: string) => {
      setIsOpen(false);
      setQuery("");
      router.push(url);
    },
    [router],
  );

  // Arrow Key Navigation Handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        e.preventDefault();
        handleSelectResult(allItems[selectedIndex].url);
      }
    }
  };

  let currentIndexTracker = 0;

  return (
    <div ref={containerRef} className="relative w-80 lg:w-96">
      {/* Search Input Container */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search IC CRM... (Ctrl+K)"
          className="w-full pl-9 pr-16 py-1.5 text-sm bg-secondary/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults({
                  contacts: [],
                  companies: [],
                  leads: [],
                  deals: [],
                  tasks: [],
                  activities: [],
                });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Grouped Search Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[480px] overflow-y-auto divide-y divide-border/60">
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Searching CRM database...
            </div>
          ) : totalCount === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                No matching records found
              </p>
              <p>Try searching for names, emails, companies, or deal titles.</p>
            </div>
          ) : (
            <>
              {/* CONTACTS GROUP */}
              {results.contacts.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Contacts (
                    {results.contacts.length})
                  </div>
                  {results.contacts.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* COMPANIES GROUP */}
              {results.companies.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Companies (
                    {results.companies.length})
                  </div>
                  {results.companies.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* LEADS GROUP */}
              {results.leads.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Leads (
                    {results.leads.length})
                  </div>
                  {results.leads.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DEALS GROUP */}
              {results.deals.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Deals (
                    {results.deals.length})
                  </div>
                  {results.deals.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TASKS GROUP */}
              {results.tasks.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Tasks (
                    {results.tasks.length})
                  </div>
                  {results.tasks.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ACTIVITIES GROUP */}
              {results.activities.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Activities (
                    {results.activities.length})
                  </div>
                  {results.activities.map((item) => {
                    const itemIndex = currentIndexTracker++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p
                            className={`text-[11px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
