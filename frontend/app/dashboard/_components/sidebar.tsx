"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Home,
  Users,
  Video,
  Tag,
  Utensils,
  RefreshCw,
  Moon,
  Sun,
  LogOut,
  Menu,
  ChevronRight,
  HandPlatter,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { signout } from "@/lib/actions/auth";
import { toast } from "sonner";
import { DashedSpinner } from "@/components/dashed-spinner";
import { cn } from "@/lib/utils";
import { SidebarLogo } from "./sidebar-logo";

// CSS custom properties for consistent animations
const sidebarAnimationStyles = {
  "--sidebar-transition-duration": "300ms",
  "--sidebar-transition-easing": "cubic-bezier(0.4, 0, 0.2, 1)",
  "--sidebar-content-delay": "150ms",
  "--sidebar-stagger-delay": "50ms",
} as React.CSSProperties;

const sidebarItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Data Sync",
    href: "/dashboard/data-sync",
    icon: RefreshCw,
  },
  {
    title: "Videos",
    href: "/dashboard/videos",
    icon: Video,
  },
  {
    title: "Restaurants",
    href: "/dashboard/restaurants",
    icon: Utensils,
  },
  {
    title: "Tags",
    href: "/dashboard/tags",
    icon: Tag,
  },
  {
    title: "Cuisines",
    href: "/dashboard/cuisines",
    icon: HandPlatter,
  },
  {
    title: "Listings",
    href: "/dashboard/listings",
    icon: FileText,
  },
  {
    title: "Influencers",
    href: "/dashboard/influencers",
    icon: Users,
  },
];

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function Sidebar({
  className,
  isMobileOpen = false,
  onMobileToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const clickOutsideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    // Load desktop collapsed state
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed === "true") {
      setIsDesktopCollapsed(true);
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Click-outside functionality for desktop sidebar
  useEffect(() => {
    // Only add listeners when sidebar is expanded (not collapsed)
    if (isDesktopCollapsed || isAnimating) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking on the sidebar itself or its children
      if (sidebarRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on the toggle button
      const toggleButton = document.querySelector(
        '[aria-label="Collapse sidebar"], [aria-label="Expand sidebar"]'
      );
      if (toggleButton?.contains(target)) {
        return;
      }

      // Don't close if clicking on mobile sheet trigger or content
      const mobileSheet = document.querySelector(
        '[data-slot="sheet-content"], [data-slot="sheet-trigger"]'
      );
      if (mobileSheet?.contains(target)) {
        return;
      }

      // Don't close if clicking on tooltips or other overlay elements
      const isTooltip = (target as Element)?.closest(
        '[role="tooltip"], [data-slot="tooltip-content"]'
      );
      if (isTooltip) {
        return;
      }

      // Add a small delay to prevent conflicts with other interactions
      if (clickOutsideTimeoutRef.current) {
        clearTimeout(clickOutsideTimeoutRef.current);
      }

      clickOutsideTimeoutRef.current = setTimeout(() => {
        if (!isAnimating && !isDesktopCollapsed) {
          setIsAnimating(true);
          setIsDesktopCollapsed(true);
          localStorage.setItem("sidebar-collapsed", "true");

          // Reset animation state after transition completes
          setTimeout(
            () => {
              setIsAnimating(false);
            },
            prefersReducedMotion ? 0 : 300
          );
        }
      }, 50);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close sidebar on Escape key for accessibility
      if (event.key === "Escape" && !isDesktopCollapsed && !isAnimating) {
        event.preventDefault();
        setIsAnimating(true);
        setIsDesktopCollapsed(true);
        localStorage.setItem("sidebar-collapsed", "true");

        // Reset animation state after transition completes
        setTimeout(
          () => {
            setIsAnimating(false);
          },
          prefersReducedMotion ? 0 : 300
        );
      }
    };

    // Use capture phase to ensure we catch events before they bubble
    document.addEventListener("mousedown", handleClickOutside, {
      capture: true,
      passive: true,
    });
    document.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, {
        capture: true,
      });
      document.removeEventListener("keydown", handleKeyDown);
      if (clickOutsideTimeoutRef.current) {
        clearTimeout(clickOutsideTimeoutRef.current);
      }
    };
  }, [isDesktopCollapsed, isAnimating, prefersReducedMotion]);

  // Sync mobile sheet state with props
  useEffect(() => {
    setIsMobileSheetOpen(isMobileOpen);
  }, [isMobileOpen]);

  // Handle mobile sheet state changes
  const handleMobileSheetChange = (open: boolean) => {
    setIsMobileSheetOpen(open);
    if (onMobileToggle && open !== isMobileOpen) {
      onMobileToggle();
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const toggleDesktopCollapsed = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newCollapsed = !isDesktopCollapsed;
    setIsDesktopCollapsed(newCollapsed);
    localStorage.setItem("sidebar-collapsed", newCollapsed.toString());

    // Reset animation state after transition completes
    setTimeout(
      () => {
        setIsAnimating(false);
      },
      prefersReducedMotion ? 0 : 300
    );
  };

  const handleSignout = async () => {
    setIsLoggingOut(true);
    try {
      const { success, error } = await signout();
      if (success) {
        toast.success("Signed out successfully");
        router.push("/");
      } else if (error) {
        toast.error("An unexpected error occurred during sign out");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRedirect = (path: string, event?: React.MouseEvent) => {
    // Prevent event bubbling that might trigger mobile sheet
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent?.stopImmediatePropagation();
    }

    router.push(path);
    // Only close mobile sheet if it's actually open (for mobile)
    if (isMobileSheetOpen) {
      setIsMobileSheetOpen(false);
      if (onMobileToggle) {
        onMobileToggle();
      }
    }
  };

  const handleNavigation = (href: string, event?: React.MouseEvent) => {
    // Prevent event bubbling that might trigger mobile sheet
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent?.stopImmediatePropagation();
    }

    router.push(href);

    // Close mobile sheet if it's open
    if (isMobileSheetOpen) {
      setIsMobileSheetOpen(false);
      if (onMobileToggle) {
        onMobileToggle();
      }
    }

    // Close desktop sidebar if it's expanded (not collapsed)
    if (!isDesktopCollapsed && !isAnimating) {
      setIsAnimating(true);
      setIsDesktopCollapsed(true);
      localStorage.setItem("sidebar-collapsed", "true");

      // Reset animation state after transition completes
      setTimeout(
        () => {
          setIsAnimating(false);
        },
        prefersReducedMotion ? 0 : 300
      );
    }
  };

  // Shared sidebar content component
  const SidebarContent = ({ forMobile = false }: { forMobile?: boolean }) => {
    const renderNavItem = (
      item: (typeof sidebarItems)[0],
      isCollapsed: boolean = false,
      index: number = 0
    ) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      const animationDelay = prefersReducedMotion ? 0 : index * 50;

      const content = (
        <Button
          variant="ghost"
          onClick={(e) => handleNavigation(item.href, e)}
          className={cn(
            "flex w-full group relative overflow-hidden",
            "transition-all duration-300 ease-out transform",
            "hover:scale-105 hover:shadow-sm",
            "will-change-transform",
            !forMobile && isCollapsed ? "justify-center" : "justify-start",
            isActive
              ? "bg-orange-500 text-primary-foreground hover:text-white hover:bg-orange-400 shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          style={{
            transitionDelay: `${animationDelay}ms`,
            transform: prefersReducedMotion ? "none" : "translate3d(0, 0, 0)",
          }}
          aria-label={item.title}
        >
          <Icon
            className={cn(
              "h-4 w-4 transition-all duration-200 ease-out",
              "will-change-transform",
              (!isCollapsed || forMobile) && "mr-2"
            )}
          />
          <span
            className={cn(
              "transition-all duration-300 ease-out whitespace-nowrap overflow-hidden",
              "will-change-opacity will-change-transform",
              !isCollapsed || forMobile
                ? "opacity-100 visible translate-x-0 max-w-none"
                : "opacity-0 invisible translate-x-0 max-w-0"
            )}
          >
            {item.title}
          </span>
        </Button>
      );

      if (!forMobile && isCollapsed) {
        return (
          <TooltipProvider key={item.href}>
            <Tooltip delayDuration={prefersReducedMotion ? 0 : 300}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent
                side="right"
                className={cn(
                  "ml-2 transition-all duration-200 ease-out",
                  "animate-in fade-in-0 zoom-in-95 slide-in-from-left-2"
                )}
              >
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return <div key={item.href}>{content}</div>;
    };

    return (
      <div className="flex flex-col h-full">
        {/* Top section - Logo/Brand */}
        <div
          className={cn(
            "flex items-center border-b border-border transition-all duration-300 ease-out",
            "px-4 py-4",
            !forMobile && isDesktopCollapsed && "justify-center !px-2"
          )}
        >
          <SidebarLogo isCollapsed={isDesktopCollapsed} forMobile={forMobile} />
        </div>

        {/* Middle section - Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav
            className={cn(
              "space-y-1 transition-all duration-300 ease-out",
              "px-4",
              !forMobile && isDesktopCollapsed && "!px-2"
            )}
          >
            {sidebarItems.map((item, index) =>
              renderNavItem(item, !forMobile && isDesktopCollapsed, index)
            )}
          </nav>
        </div>

        {/* Bottom section - Theme toggle and user menu */}
        <div
          className={cn(
            "border-t border-border space-y-2 transition-all duration-300 ease-out",
            "px-4 py-4",
            !forMobile && isDesktopCollapsed && "!px-2"
          )}
        >
          {/* Theme toggle */}
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className={cn(
              "w-full transition-all duration-300 ease-out transform hover:scale-105",
              "will-change-transform",
              !forMobile && isDesktopCollapsed
                ? "justify-center"
                : "justify-start"
            )}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun
                className={cn(
                  "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                  (!isDesktopCollapsed || forMobile) && "mr-2"
                )}
              />
            ) : (
              <Moon
                className={cn(
                  "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                  (!isDesktopCollapsed || forMobile) && "mr-2"
                )}
              />
            )}
            <span
              className={cn(
                "transition-all duration-300 ease-out whitespace-nowrap overflow-hidden",
                "will-change-opacity will-change-transform",
                !isDesktopCollapsed || forMobile
                  ? "opacity-100 translate-x-0 max-w-none"
                  : "opacity-0 translate-x-2 max-w-0"
              )}
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </Button>

          {/* User menu */}
          {user ? (
            <Button
              variant="ghost"
              onClick={handleSignout}
              disabled={isLoggingOut}
              className={cn(
                "w-full transition-all duration-300 ease-out transform hover:scale-105",
                "will-change-transform",
                !forMobile && isDesktopCollapsed
                  ? "justify-center px-2"
                  : "justify-start"
              )}
              aria-label="Sign out"
            >
              {isLoggingOut ? (
                <DashedSpinner
                  className={cn(
                    "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                    (!isDesktopCollapsed || forMobile) && "mr-2"
                  )}
                />
              ) : (
                <LogOut
                  className={cn(
                    "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                    (!isDesktopCollapsed || forMobile) && "mr-2"
                  )}
                />
              )}
              <span
                className={cn(
                  "transition-all duration-300 ease-out whitespace-nowrap overflow-hidden",
                  "will-change-opacity will-change-transform",
                  !isDesktopCollapsed || forMobile
                    ? "opacity-100 translate-x-0 max-w-none"
                    : "opacity-0 translate-x-2 max-w-0"
                )}
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </span>
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={(e) => handleRedirect("/login", e)}
                className={cn(
                  "w-full transition-all duration-300 ease-out transform hover:scale-105",
                  "will-change-transform",
                  !forMobile && isDesktopCollapsed
                    ? "justify-center"
                    : "justify-start"
                )}
                aria-label="Login"
              >
                <LogOut
                  className={cn(
                    "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                    (!isDesktopCollapsed || forMobile) && "mr-2"
                  )}
                />
                <span
                  className={cn(
                    "transition-all duration-300 ease-out whitespace-nowrap overflow-hidden",
                    "will-change-opacity will-change-transform",
                    !isDesktopCollapsed || forMobile
                      ? "opacity-100 translate-x-0 max-w-none"
                      : "opacity-0 translate-x-2 max-w-0"
                  )}
                >
                  Login
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={(e) => handleRedirect("/register", e)}
                className={cn(
                  "w-full transition-all duration-300 ease-out transform hover:scale-105",
                  "will-change-transform",
                  !forMobile && isDesktopCollapsed
                    ? "justify-center"
                    : "justify-start"
                )}
                aria-label="Register"
              >
                <Users
                  className={cn(
                    "h-4 w-4 transition-all duration-200 ease-out flex-shrink-0",
                    (!isDesktopCollapsed || forMobile) && "mr-2"
                  )}
                />
                <span
                  className={cn(
                    "transition-all duration-300 ease-out whitespace-nowrap overflow-hidden",
                    "will-change-opacity will-change-transform",
                    !isDesktopCollapsed || forMobile
                      ? "opacity-100 translate-x-0 max-w-none"
                      : "opacity-0 translate-x-2 max-w-0"
                  )}
                >
                  Register
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Sheet Sidebar */}
      <Sheet open={isMobileSheetOpen} onOpenChange={handleMobileSheetChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "md:hidden absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border shadow-lg",
              "hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-out",
              "transform hover:scale-110 will-change-transform translate3d(0, 0, 0)"
            )}
            aria-label="Open menu"
            onClick={(e) => {
              // Ensure this only responds to direct clicks
              e.stopPropagation();
            }}
          >
            <Menu className="h-4 w-4 transition-transform duration-200 ease-out" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            "w-64 p-0 transition-all duration-300 ease-out",
            "bg-background dark:!bg-black",
            "will-change-transform"
          )}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out",
              "animate-in fade-in-0 slide-in-from-left-4",
              isMobileSheetOpen
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2"
            )}
          >
            <SidebarContent forMobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div
        ref={sidebarRef}
        style={sidebarAnimationStyles}
        className={cn(
          "hidden md:flex flex-col bg-background dark:!bg-black border-r border-border",
          "transition-all duration-300 ease-out will-change-transform",
          "transform translate3d(0, 0, 0)", // Force hardware acceleration
          isDesktopCollapsed ? "w-20" : "w-80",
          isAnimating && "pointer-events-none opacity-95", // Prevent interactions during animation with subtle opacity
          className
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={isDesktopCollapsed}
        tabIndex={isDesktopCollapsed ? -1 : 0}
        onClick={(e) => {
          // Prevent any clicks from bubbling up to potential mobile sheet triggers
          e.stopPropagation();
        }}
      >
        <SidebarContent forMobile={false} />
      </div>

      {/* Desktop toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDesktopCollapsed}
        disabled={isAnimating}
        className={cn(
          "hidden md:flex fixed top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm border border-orange-500 shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 transform hover:scale-110",
          "will-change-transform transform translate3d(0, 0, 0)",
          isAnimating && "pointer-events-none opacity-75",
          isDesktopCollapsed ? "left-[4.5rem]" : "left-[19rem]"
        )}
        aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div
          className={cn(
            "transition-transform duration-300 ease-out",
            "will-change-transform",
            isDesktopCollapsed ? "rotate-0" : "rotate-180"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      </Button>
    </>
  );
}
