import { MoreHorizontal } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { cn } from "@/lib/utils.ts";
import {
  partitionMobileNavigation,
  preloadNavigationItem,
  type NavigationItem,
} from "./navigation.ts";

type MobileNavigationProps = {
  items: NavigationItem[];
  translate: (key: string) => string;
};

export function MobileNavigation({ items, translate }: MobileNavigationProps) {
  const { primaryItems, overflowItems } = partitionMobileNavigation(items);
  const moreLabel = translate("detail.more");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-start justify-around border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      {primaryItems.map((item) => (
        <MobileNavigationLink
          key={item.to}
          item={item}
          label={translate(item.labelKey)}
        />
      ))}

      {overflowItems.length > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 px-1 py-2 text-[10px] text-muted-foreground"
              aria-label={moreLabel}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate text-center">
                {moreLabel}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>{moreLabel}</SheetTitle>
              <SheetDescription className="sr-only">
                {translate("app.subtitle")}
              </SheetDescription>
            </SheetHeader>
            <nav className="grid gap-1 px-4 pb-4" aria-label={moreLabel}>
              {overflowItems.map((item) => {
                const label = translate(item.labelKey);

                return (
                  <SheetClose key={item.to} asChild>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      aria-label={label}
                      onFocus={() => preloadNavigationItem(item)}
                      onTouchStart={() => preloadNavigationItem(item)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent",
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
}

function MobileNavigationLink({
  item,
  label,
}: {
  item: NavigationItem;
  label: string;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      aria-label={label}
      onFocus={() => preloadNavigationItem(item)}
      onTouchStart={() => preloadNavigationItem(item)}
      className={({ isActive }) =>
        cn(
          "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 px-1 py-2 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      <item.icon className="h-5 w-5" aria-hidden="true" />
      <span className="max-w-full truncate text-center">{label}</span>
    </NavLink>
  );
}
