
import React from 'react';
import { ScrollArea as BaseScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ScrollAreaHorizontalProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * A ScrollArea component that adds support for the 'orientation' prop
 * This is a wrapper around the base ScrollArea component
 */
const ScrollAreaHorizontal = React.forwardRef<
  HTMLDivElement,
  ScrollAreaHorizontalProps
>(({ children, orientation = "horizontal", className, ...props }, ref) => {
  return (
    <BaseScrollArea ref={ref} className={className} {...props}>
      {children}
      <ScrollBar orientation={orientation} />
    </BaseScrollArea>
  );
});
ScrollAreaHorizontal.displayName = "ScrollAreaHorizontal";

export { ScrollAreaHorizontal };
