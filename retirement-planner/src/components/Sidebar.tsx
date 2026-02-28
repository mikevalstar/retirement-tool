import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  FileText,
  GitBranch,
  Home,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Receipt,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavChild = { label: string; path: string };

type NavSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  color: string;
  path: string;
  children?: NavChild[];
};

const NAV: NavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "#06b6d4",
    path: "/",
  },
  {
    id: "investments",
    label: "Investments",
    icon: TrendingUp,
    color: "#10b981",
    path: "/investments",
    children: [
      { label: "Accounts", path: "/investments/accounts" },
      { label: "Allocations", path: "/investments/allocations" },
      { label: "Glide Paths", path: "/investments/glide-paths" },
    ],
  },
  {
    id: "income",
    label: "Income",
    icon: Wallet,
    color: "#14b8a6",
    path: "/income",
    children: [
      { label: "Employment", path: "/income/employment" },
      { label: "Social Security", path: "/income/social-security" },
      { label: "Passive Streams", path: "/income/passive-streams" },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: Receipt,
    color: "#f59e0b",
    path: "/expenses",
    children: [
      { label: "Monthly Import", path: "/expenses/monthly-import" },
      { label: "Budget Baseline", path: "/expenses/budget-baseline" },
      { label: "Categories", path: "/expenses/categories" },
    ],
  },
  {
    id: "housing",
    label: "Housing",
    icon: Home,
    color: "#6366f1",
    path: "/housing",
    children: [
      { label: "Mortgage", path: "/housing/mortgage" },
      { label: "Home Equity", path: "/housing/home-equity" },
      { label: "Future Events", path: "/housing/future-events" },
    ],
  },
  {
    id: "taxes",
    label: "Taxes",
    icon: FileText,
    color: "#f97316",
    path: "/taxes",
    children: [
      { label: "Overview", path: "/taxes/overview" },
      { label: "Roth Scenarios", path: "/taxes/roth-scenarios" },
      { label: "RMDs", path: "/taxes/rmds" },
    ],
  },
  {
    id: "scenarios",
    label: "Scenarios",
    icon: GitBranch,
    color: "#8b5cf6",
    path: "/scenarios",
    children: [
      { label: "Configure", path: "/scenarios/configure" },
      { label: "Compare", path: "/scenarios/compare" },
    ],
  },
  {
    id: "simulation",
    label: "Simulation",
    icon: Play,
    color: "#00e5ff",
    path: "/simulation",
    children: [
      { label: "Run", path: "/simulation/run" },
      { label: "Results", path: "/simulation/results" },
    ],
  },
];

// ─── Sidebar component ────────────────────────────────────────────────────────

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { location } = useRouterState();
  const pathname = location.pathname;

  // Track which sections are expanded (accordion)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const s of NAV) {
      if (s.children && (pathname === s.path || pathname.startsWith(s.path + "/"))) {
        initial.add(s.id);
      }
    }
    return initial;
  });

  const toggleSection = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-expand the section that contains the current route when navigating
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const s of NAV) {
        if (s.children && (pathname === s.path || pathname.startsWith(s.path + "/"))) {
          next.add(s.id);
        }
      }
      return next;
    });
  }, [pathname]);

  const isActive = (section: NavSection) => (section.path === "/" ? pathname === "/" : pathname === section.path || pathname.startsWith(section.path + "/"));

  const W = collapsed ? 52 : 220;

  return (
    <div
      className="flex flex-col overflow-hidden h-screen shrink-0"
      style={{
        width: W,
        minWidth: W,
        maxWidth: W,
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        transition: "width 200ms ease, min-width 200ms ease, max-width 200ms ease",
      }}>
      {/* ── Header ── */}
      <div
        className="flex items-center shrink-0 gap-2"
        style={{
          height: 44,
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0" : "0 10px 0 14px",
          borderBottom: "1px solid var(--border)",
        }}>
        {/* App mark */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded shrink-0" style={{ background: "linear-gradient(135deg, #06b6d4 0%, #2dd4bf 100%)" }} />
          {!collapsed && (
            <span className="text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis tracking-[-0.01em]" style={{ color: "var(--text)" }}>
              Retirement Planner
            </span>
          )}
        </div>

        {/* Collapse toggle (expanded mode only) */}
        {!collapsed && (
          <button type="button" onClick={onToggle} title="Collapse sidebar" className={iconBtnCls} style={{ color: "var(--text-dim)" }}>
            <PanelLeftClose size={13} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5">
        {NAV.map((section) => {
          const Icon = section.icon;
          const active = isActive(section);
          const open = expanded.has(section.id);
          const hasChildren = !!section.children?.length;

          return (
            <div key={section.id}>
              {/* Section row */}
              {hasChildren ? (
                <div className="flex relative">
                  <Link
                    to={section.path as any}
                    title={collapsed ? section.label : undefined}
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        next.add(section.id);
                        return next;
                      })
                    }
                    className={rowBaseCls}
                    style={{ ...rowStyle(active, section.color, collapsed), flex: 1, paddingRight: collapsed ? undefined : 28 }}>
                    <IconSlot collapsed={collapsed} active={active} color={section.color}>
                      <Icon size={15} strokeWidth={1.75} style={{ color: active ? section.color : "inherit" }} />
                    </IconSlot>
                    {!collapsed && <span className="flex-1 whitespace-nowrap">{section.label}</span>}
                  </Link>
                  {/* Chevron: only toggles accordion, does not navigate */}
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSection(section.id);
                      }}
                      className={iconBtnCls}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-dim)",
                      }}>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: open ? "rotate(180deg)" : "none",
                          transition: "transform 200ms ease",
                        }}
                      />
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  to={section.path as any}
                  title={collapsed ? section.label : undefined}
                  className={rowBaseCls}
                  style={rowStyle(active, section.color, collapsed)}>
                  <IconSlot collapsed={collapsed} active={active} color={section.color}>
                    <Icon size={15} strokeWidth={1.75} style={{ color: active ? section.color : "inherit" }} />
                  </IconSlot>
                  {!collapsed && <span className="flex-1 whitespace-nowrap">{section.label}</span>}
                </Link>
              )}

              {/* Children */}
              {hasChildren && !collapsed && (
                <div
                  style={{
                    maxHeight: open ? section.children!.length * 34 : 0,
                    overflow: "hidden",
                    transition: "max-height 200ms ease",
                  }}>
                  {section.children!.map((child) => {
                    const childActive = pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path as any}
                        className="flex items-center gap-1.5 h-[34px] pl-9 pr-3 text-[12.5px] whitespace-nowrap"
                        style={{
                          color: childActive ? "var(--text)" : "var(--text-dim)",
                          borderLeft: `3px solid ${childActive ? section.color : "transparent"}`,
                          background: childActive ? "rgba(240, 246, 252, 0.03)" : "none",
                          transition: "color 150ms, background 150ms",
                        }}>
                        {childActive && <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: section.color }} />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Divider + Settings ── */}
      <div className="shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <Link
          to={"/settings" as any}
          title={collapsed ? "Settings" : undefined}
          className={rowBaseCls}
          style={rowStyle(pathname === "/settings", "#6e7681", collapsed)}>
          <IconSlot collapsed={collapsed} active={pathname === "/settings"} color="#6e7681">
            <Settings size={15} strokeWidth={1.75} />
          </IconSlot>
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </Link>
      </div>

      {/* ── Expand button (collapsed mode only) ── */}
      {collapsed && (
        <div className="p-1.5 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onToggle} title="Expand sidebar" className={`${iconBtnCls} w-full justify-center`} style={{ color: "var(--text-dim)" }}>
            <PanelLeftOpen size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

// Static Tailwind classes for all nav row elements
const rowBaseCls = "flex items-center h-9 w-full text-[13px] cursor-pointer border-none no-underline box-border";

// Dynamic/CSS-var-only properties (active state, color, collapsed layout)
function rowStyle(active: boolean, color: string, collapsed: boolean): React.CSSProperties {
  return {
    gap: collapsed ? 0 : 6,
    padding: collapsed ? 0 : "0 10px 0 0",
    paddingLeft: 0,
    background: active ? "rgba(240, 246, 252, 0.05)" : "none",
    color: active ? "var(--text)" : "var(--text-muted)",
    fontWeight: active ? 500 : 400,
    fontFamily: "inherit",
    justifyContent: collapsed ? "center" : "flex-start",
    borderLeft: `3px solid ${active ? color : "transparent"}`,
    transition: "background 150ms, color 150ms, border-color 150ms",
  };
}

function IconSlot({ collapsed, active, color, children }: { collapsed: boolean; active: boolean; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center shrink-0 relative h-full" style={{ width: collapsed ? "100%" : 36 }}>
      {children}
      {/* Active dot in collapsed mode */}
      {collapsed && active && <div className="absolute top-1.5 right-2 w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color }} />}
    </div>
  );
}

const iconBtnCls = "flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer";
