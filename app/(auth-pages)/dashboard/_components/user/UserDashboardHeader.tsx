"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageFitMode, getImageFitClass, isValidImageFitMode } from "@/types/ui";
import Link from "next/link";

interface MenuItem {
  key: string;
  label: string;
}

interface UserDashboardHeaderProps {
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
  readonly onLogout: () => void;
  readonly unreadNotificationsCount?: number;
}

const menuItems: MenuItem[] = [
  { key: "upload", label: "Upload & My Files" },
  { key: "responses", label: "Your Accountant" },
  { key: "forms", label: "Forms" },
  { key: "notifications", label: "Notifications" },
  { key: "archive", label: "Archive" },
  { key: "profile", label: "Profile" },
];

// Moved out of component to satisfy Sonar rule: no nested component definitions
const NotificationsBadge = ({ count }: { count: number }) => (
  <span
    aria-label={`${count} unread notifications`}
    className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-none font-semibold"
  >
    {count > 99 ? "99+" : count}
  </span>
);

const MenuButton = ({
  item,
  isActive,
  onClick,
  unreadCount,
  variant,
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
  unreadCount: number;
  variant: "desktop" | "mobile";
}) => {
  const baseClasses =
    variant === "desktop"
      ? "relative text-white text-sm lg:text-base px-2 lg:px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
      : "relative block text-white text-base px-4 py-2 rounded-lg text-left transition-colors cursor-pointer";
  const activeClasses = "bg-cyan-600 hover:bg-cyan-500";
  const inactiveClasses = "hover:text-white";

  return (
    <button
      key={item.key}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <span className={variant === "desktop" ? "flex items-center gap-1 lg:gap-2" : "flex items-center gap-2"}>
        {item.label}
        {item.key === "notifications" && unreadCount > 0 && (
          <NotificationsBadge count={unreadCount} />
        )}
      </span>
    </button>
  );
};

const UserInfoLogout = ({
  firstName,
  profileImageUrl,
  imageFitMode,
  onLogout,
  containerClass,
  buttonClass,
}: {
  firstName?: string;
  profileImageUrl?: string;
  imageFitMode?: ImageFitMode;
  onLogout: () => void;
  containerClass: string;
  buttonClass: string;
}) => {
  return (
    <div className={containerClass}>
      {firstName && (
        <div className="flex items-center gap-2 text-white">
          <Avatar className="h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-600">
            {profileImageUrl && (
              <AvatarImage
                src={profileImageUrl}
                alt="Profile"
                className={getImageFitClass(imageFitMode)}
                onError={() => {
                  // Suppress error logging for Google profile images
                  if (!profileImageUrl?.includes('googleusercontent.com')) {
                    console.error('Failed to load profile image:', profileImageUrl);
                  }
                }}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="text-[10px] font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{firstName}</span>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className={buttonClass}
      >
        Logout
      </Button>
    </div>
  );
};

export default function UserDashboardHeader({
  activeTab,
  onTabChange,
  onLogout,
  unreadNotificationsCount = 0,
}: UserDashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadNotificationsCount);
  const [headerProfileImageUrl, setHeaderProfileImageUrl] = useState<string | undefined>(undefined);
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>('fit');
  const headerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const anySession = session as any;
  const firstName = anySession?.user?.name ? anySession.user.name.split(' ')[0] : undefined;
  const profileImageUrl = (headerProfileImageUrl || anySession?.user?.image || anySession?.user?.profileUrl) as string | undefined;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle tab change with immediate UI update and optimized URL update
  const handleTabChange = useCallback((tabKey: string) => {
    // Immediate UI update - no blocking
    onTabChange(tabKey);
    
    // Non-blocking URL update using requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabKey);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  }, [onTabChange, searchParams, router]);

  // Read initial tab from URL on component mount (only once)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && menuItems.some(item => item.key === tabFromUrl)) {
      onTabChange(tabFromUrl);
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // Keep local count in sync with prop updates
  useEffect(() => {
    setLiveUnreadCount(unreadNotificationsCount);
  }, [unreadNotificationsCount]);

  // Fetch profile image from API and listen for updates
  useEffect(() => {
    let isMounted = true;
    const loadProfileImage = async () => {
      try {
        const res = await fetch('/api/user/info');
        if (!res.ok) return;
        const data = await res.json();
        const url = (data?.profileImageUrl || data?.profileUrl) as string | undefined;
        if (isMounted) setHeaderProfileImageUrl(url);
        // Load persisted fit mode for this user
        try {
          const userId = data?.id;
          if (userId) {
            const persisted = localStorage.getItem(`profileImageFitMode:${userId}`) as ImageFitMode | null;
            if (persisted && isValidImageFitMode(persisted)) {
              setImageFitMode(persisted);
            }
          }
        } catch {}
      } catch {}
    };
    loadProfileImage();

    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ url?: string }>;
      const url = ce.detail?.url;
      if (url) setHeaderProfileImageUrl(url);
    };
    try { globalThis.addEventListener('profile:image_updated', handler as EventListener); } catch {}

    const modeHandler = (e: Event) => {
      const ce = e as CustomEvent<{ mode?: ImageFitMode }>;
      const m = ce.detail?.mode;
      if (m && isValidImageFitMode(m)) setImageFitMode(m);
    };
    try { globalThis.addEventListener('profile:image_fit_mode_updated', modeHandler as EventListener); } catch {}

    return () => {
      isMounted = false;
      try { globalThis.removeEventListener('profile:image_updated', handler as EventListener); } catch {}
      try { globalThis.removeEventListener('profile:image_fit_mode_updated', modeHandler as EventListener); } catch {}
    };
  }, []);

  // Listen for notification updates (user scope)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ scope?: string; unreadCount?: number }>;
      if (ce.detail?.scope === "user" && typeof ce.detail.unreadCount === "number") {
        setLiveUnreadCount(ce.detail.unreadCount);
      }
    };
    if (typeof globalThis !== "undefined") {
      globalThis.addEventListener("notifications:updated", handler as EventListener);
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel("notifications");
        bc.onmessage = (msg) => {
          const data = msg?.data as { scope?: string; unreadCount?: number };
          if (data?.scope === "user" && typeof data.unreadCount === "number") {
            setLiveUnreadCount(data.unreadCount);
          }
        };
      } catch (error) {
        console.error("Failed to create BroadcastChannel:", error);
      }

      return () => {
        globalThis.removeEventListener("notifications:updated", handler as EventListener);
        try { 
          bc?.close(); 
        } catch (error) {
          console.error("Failed to close BroadcastChannel:", error);
        }
      };
    }
    return undefined;
  }, []);
  

  return (
    <header className="bg-[#007399] fixed top-0 left-0 right-0 z-50" ref={headerRef}>
      {/* Main Navigation (match admin header layout) */}
      <div className="w-full mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="/image-000.png"
              alt="Accufin Logo"
              className="h-16 w-auto rounded-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center justify-center gap-2 lg:gap-3 xl:gap-4 w-full max-w-4xl">
              {menuItems.map((item) => (
                <MenuButton
                  key={item.key}
                  item={item}
                  isActive={activeTab === item.key}
                  onClick={() => handleTabChange(item.key)}
                  unreadCount={liveUnreadCount}
                  variant="desktop"
                />
              ))}
            </div>
          </nav>

          {/* User Info and Logout */}
          <UserInfoLogout
            firstName={firstName}
            profileImageUrl={profileImageUrl}
            imageFitMode={imageFitMode}
            onLogout={onLogout}
            containerClass="hidden lg:flex lg:flex-col lg:items-center gap-2 lg:gap-3 flex-shrink-0"
            buttonClass="text-xs lg:text-sm"
          />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white text-2xl"
          >
            {isMenuOpen ? <IoMdClose /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#0082a3] px-4 py-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <nav className="flex flex-col gap-3 pb-4">
            {menuItems.map((item) => (
              <MenuButton
                key={item.key}
                item={item}
                isActive={activeTab === item.key}
                onClick={() => {
                  handleTabChange(item.key);
                  setIsMenuOpen(false);
                }}
                unreadCount={liveUnreadCount}
                variant="mobile"
              />
            ))}
            <UserInfoLogout
              firstName={firstName}
              profileImageUrl={profileImageUrl}
              imageFitMode={imageFitMode}
              onLogout={onLogout}
              containerClass="flex flex-col gap-2 mt-2 px-4"
              buttonClass="mt-2"
            />
          </nav>
        </div>
      )}
    </header>
  );
}
