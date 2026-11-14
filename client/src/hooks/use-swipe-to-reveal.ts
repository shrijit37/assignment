import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface SwipeOptions {
  /** How far the row travels, in pixels. */
  width?: number;
  /** Fraction of `width` that must be crossed to stay open. */
  threshold?: number;
}

interface SwipeState {
  offset: number;
  open: boolean;
  dragging: boolean;
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  close: () => void;
}

/**
 * Tracks a horizontal drag on a touch pointer so a list row can reveal an
 * action behind it. Vertical drags are left to the page so scrolling keeps
 * working, and mouse users never get a half-swiped row.
 *
 * @param options Reveal width and open threshold.
 */
export function useSwipeToReveal({ width = 92, threshold = 0.35 }: SwipeOptions = {}): SwipeState {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const drag = useRef<{
    x: number;
    y: number;
    base: number;
    axis: "x" | "y" | null;
  } | null>(null);

  const moveTo = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const close = useCallback(() => {
    drag.current = null;
    setDragging(false);
    setOpen(false);
    moveTo(0);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;

    drag.current = {
      x: event.clientX,
      y: event.clientY,
      base: open ? -width : 0,
      axis: null,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;

    const deltaX = event.clientX - current.x;
    const deltaY = event.clientY - current.y;

    if (!current.axis) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;

      current.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";

      if (current.axis === "x") {
        setDragging(true);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Capture is an optimisation; synthetic or cancelled pointers can reject it.
        }
      }
    }

    if (current.axis !== "x") return;

    const next = Math.min(0, Math.max(-width, current.base + deltaX));
    moveTo(next);
  };

  const settle = () => {
    const current = drag.current;
    drag.current = null;
    setDragging(false);

    if (!current || current.axis !== "x") return;

    const shouldOpen = offsetRef.current <= -width * threshold;
    setOpen(shouldOpen);
    moveTo(shouldOpen ? -width : 0);
  };

  return {
    offset,
    open,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: settle,
      onPointerCancel: settle,
    },
    close,
  };
}
