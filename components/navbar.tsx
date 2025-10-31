"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
              Wordle Helper
            </span>
          </Link>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

