"use client";

import * as React from "react";
import {
  Root as ScrollAreaPrimitiveRoot,
  Viewport as ScrollAreaPrimitiveViewport,
  Scrollbar as ScrollAreaPrimitiveScrollbar,
  Thumb as ScrollAreaPrimitiveThumb,
  Corner as ScrollAreaPrimitiveCorner,
} from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitiveRoot>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitiveRoot>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitiveRoot
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitiveViewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitiveViewport>
    <ScrollBar />
    <ScrollAreaPrimitiveCorner />
  </ScrollAreaPrimitiveRoot>
));
ScrollArea.displayName = ScrollAreaPrimitiveRoot.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitiveScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitiveScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitiveScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitiveThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitiveScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitiveScrollbar.displayName;

export { ScrollArea, ScrollBar };
