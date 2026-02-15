"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────

const COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#000000", label: "Black" },
];

const PEN_WIDTH_MOUSE = 2.5;
const PEN_WIDTH_STYLUS_MAX = 5;
const HIGHLIGHTER_WIDTH = 22;
const HIGHLIGHTER_ALPHA = 0.35;
const ERASER_RADIUS = 14;

/** Interactive elements the user can click through to */
const INTERACTIVE_SELECTOR =
  'input, textarea, select, button, a, label, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [role="listbox"], [role="option"], [role="tab"], [contenteditable="true"]';

type Tool = "pen" | "highlighter" | "eraser";

interface Point {
  x: number;
  y: number;
  w?: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  points: Point[];
}

interface AnnotationOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

// ── Drawing helpers ──────────────────────────────────────────

function drawPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  offsetX: number,
  offsetY: number
) {
  if (points.length === 0) return;

  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x + offsetX, points[0].y + offsetY, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY);

  if (points.length === 2) {
    ctx.lineTo(points[1].x + offsetX, points[1].y + offsetY);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2 + offsetX;
      const midY = (points[i].y + points[i + 1].y) / 2 + offsetY;
      ctx.quadraticCurveTo(
        points[i].x + offsetX,
        points[i].y + offsetY,
        midX,
        midY
      );
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x + offsetX, last.y + offsetY);
  }
  ctx.stroke();
}

function drawPenStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  offsetX: number,
  offsetY: number
) {
  if (points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    const w = points[0].w ?? PEN_WIDTH_MOUSE;
    ctx.beginPath();
    ctx.arc(points[0].x + offsetX, points[0].y + offsetY, w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    ctx.lineWidth = p1.w ?? PEN_WIDTH_MOUSE;
    ctx.beginPath();
    ctx.moveTo(p0.x + offsetX, p0.y + offsetY);
    ctx.lineTo(p1.x + offsetX, p1.y + offsetY);
    ctx.stroke();
  }
}

function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  offsetX: number,
  offsetY: number
) {
  ctx.save();
  if (stroke.tool === "highlighter") {
    ctx.globalAlpha = HIGHLIGHTER_ALPHA;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    drawPath(ctx, stroke.points, HIGHLIGHTER_WIDTH, offsetX, offsetY);
  } else if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    drawPath(ctx, stroke.points, ERASER_RADIUS * 2, offsetX, offsetY);
  } else {
    drawPenStroke(ctx, stroke.points, stroke.color, offsetX, offsetY);
  }
  ctx.restore();
}

// ── Check if an element (or ancestor) is interactive ─────────

function isInteractiveElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  // Check the element itself and walk up to find interactive parents
  const interactive = el.closest(INTERACTIVE_SELECTOR);
  if (interactive) return true;
  // Also check if inside a popover, dialog, dropdown, or the toolbar
  const overlay = el.closest("[data-annotation-toolbar]");
  if (overlay) return true;
  // Shadcn select/popover portals
  const portal = el.closest("[data-radix-popper-content-wrapper], [role='dialog'], [role='listbox'], [data-radix-menu-content]");
  if (portal) return true;
  return false;
}

// ── Component ────────────────────────────────────────────────

export function AnnotationOverlay({ isActive, onClose }: AnnotationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const completedStrokes = useRef<Stroke[]>([]);
  const activeStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  const redoStack = useRef<Stroke[]>([]);

  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [showColors, setShowColors] = useState(false);
  const [, setRenderTick] = useState(0);

  // Store current tool/color in refs so window-level handlers see latest values
  const activeToolRef = useRef(activeTool);
  const activeColorRef = useRef(activeColor);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);

  // ── Canvas sizing ────────────────────────────────────────
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  // ── Full redraw ──────────────────────────────────────────
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const offsetX = -window.scrollX;
    const offsetY = -window.scrollY;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of completedStrokes.current) {
      renderStroke(ctx, stroke, offsetX, offsetY);
    }
    if (activeStroke.current) {
      renderStroke(ctx, activeStroke.current, offsetX, offsetY);
    }
  }, []);

  const requestRedraw = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(redrawAll);
  }, [redrawAll]);

  // ── Window-level pointer handlers ────────────────────────
  // These are attached to the window so the canvas can be pointer-events:none
  // and the user can still interact with form elements underneath.

  useEffect(() => {
    if (!isActive) return;

    const getPagePoint = (e: PointerEvent): Point => ({
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
      w:
        e.pointerType === "pen"
          ? Math.max(1, e.pressure * PEN_WIDTH_STYLUS_MAX)
          : PEN_WIDTH_MOUSE,
    });

    const onPointerDown = (e: PointerEvent) => {
      // If the target is an interactive element, let it handle the event
      if (isInteractiveElement(e.target)) return;

      e.preventDefault();
      isDrawing.current = true;
      redoStack.current = [];

      const pt = getPagePoint(e);
      activeStroke.current = {
        tool: activeToolRef.current,
        color: activeColorRef.current,
        points: [pt],
      };
      requestRedraw();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawing.current || !activeStroke.current) return;
      e.preventDefault();
      const pt = getPagePoint(e);
      activeStroke.current.points.push(pt);
      requestRedraw();
    };

    const onPointerUp = () => {
      if (!isDrawing.current || !activeStroke.current) return;
      isDrawing.current = false;
      completedStrokes.current.push(activeStroke.current);
      activeStroke.current = null;
      requestRedraw();
      setRenderTick((t) => t + 1);
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove, { capture: true });
    window.addEventListener("pointerup", onPointerUp, { capture: true });
    window.addEventListener("pointercancel", onPointerUp, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("pointermove", onPointerMove, { capture: true });
      window.removeEventListener("pointerup", onPointerUp, { capture: true });
      window.removeEventListener("pointercancel", onPointerUp, { capture: true });
    };
  }, [isActive, requestRedraw]);

  // ── Setup: size canvas, listen for scroll & resize ───────
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      sizeCanvas();
      requestRedraw();
    };

    setTimeout(() => {
      sizeCanvas();
      requestRedraw();
    }, 30);

    window.addEventListener("scroll", requestRedraw, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", requestRedraw);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, sizeCanvas, requestRedraw]);

  // ── Undo / Redo / Clear ──────────────────────────────────
  const handleUndo = useCallback(() => {
    if (completedStrokes.current.length === 0) return;
    const removed = completedStrokes.current.pop()!;
    redoStack.current.push(removed);
    requestRedraw();
    setRenderTick((t) => t + 1);
  }, [requestRedraw]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const restored = redoStack.current.pop()!;
    completedStrokes.current.push(restored);
    requestRedraw();
    setRenderTick((t) => t + 1);
  }, [requestRedraw]);

  const handleClear = useCallback(() => {
    if (completedStrokes.current.length === 0) return;
    redoStack.current = [...completedStrokes.current].reverse();
    completedStrokes.current = [];
    requestRedraw();
    setRenderTick((t) => t + 1);
  }, [requestRedraw]);

  // ── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, onClose, handleUndo, handleRedo]);

  if (!isActive) return null;

  return (
    <>
      {/* Canvas: pointer-events OFF — doesn't block UI interaction */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        style={{ touchAction: "none" }}
      />

      {/* Floating toolbar */}
      <div
        data-annotation-toolbar
        className="fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
      >
        <Button
          size="icon"
          variant={activeTool === "pen" ? "default" : "ghost"}
          className="size-8 rounded-full"
          onClick={() => setActiveTool("pen")}
          title="Pen"
        >
          <Pen className="size-4" />
        </Button>

        <Button
          size="icon"
          variant={activeTool === "highlighter" ? "default" : "ghost"}
          className="size-8 rounded-full"
          onClick={() => setActiveTool("highlighter")}
          title="Highlighter"
        >
          <Highlighter className="size-4" />
        </Button>

        <Button
          size="icon"
          variant={activeTool === "eraser" ? "default" : "ghost"}
          className="size-8 rounded-full"
          onClick={() => setActiveTool("eraser")}
          title="Eraser"
        >
          <Eraser className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={() => setShowColors(!showColors)}
            title="Color"
          >
            <Palette className="size-4" style={{ color: activeColor }} />
          </Button>
          {showColors && (
            <div className="absolute left-1/2 top-full mt-2 flex -translate-x-1/2 gap-1 rounded-full border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform hover:scale-110",
                    activeColor === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c.value }}
                  onClick={() => {
                    setActiveColor(c.value);
                    setShowColors(false);
                  }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          onClick={handleUndo}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          onClick={handleRedo}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="size-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full text-destructive"
          onClick={handleClear}
          title="Clear all"
        >
          <Trash2 className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          onClick={onClose}
          title="Exit drawing (Esc)"
        >
          <X className="size-4" />
        </Button>
      </div>
    </>
  );
}
