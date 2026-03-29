import { ShapeField } from '../types';

/**
 * SVGField converts an SVG path into a signed distance field-like interface. 
 * Since calculating true SDF for arbitrary Bezier spans is expensive in JS, 
 * we use a rasterized mask or sample-based approach for the "in/out" part of layout.
 */
export class SVGField implements ShapeField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private path: Path2D;

  constructor(
    public svgPath: string,
    public x: number,
    public y: number,
    public scale: number,
    public maxWidth: number,
    public height: number
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = maxWidth;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.path = new Path2D(svgPath);
  }

  getSDF(x: number, y: number): number {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.scale(this.scale, this.scale);
    const isInside = this.ctx.isPointInPath(this.path, (x - this.x)/this.scale, (y - this.y)/this.scale);
    this.ctx.restore();
    return isInside ? -10 : 10;
  }

  getAvailableSpans(y: number, lineHeight: number): { x: number; width: number }[] {
    const spans: { x: number; width: number }[] = [];
    const step = 4; // Pixel precision for layout
    const threshold = 1; // Tolerance

    let currentSpan: { x: number; width: number } | null = null;

    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.scale(this.scale, this.scale);

    for (let x = 0; x < this.maxWidth; x += step) {
      // Check if point is INSIDE the path. 
      // isPointInPath works with the path's coordinates relative to the transform.
      // So we need to feed it global coords if we've transformed the context? 
      // Actually isPointInPath(path, x, y) uses the coordinates as provided.
      const isInsideTop = this.ctx.isPointInPath(this.path, (x - this.x)/this.scale, (y - this.y)/this.scale);
      const isInsideBottom = this.ctx.isPointInPath(this.path, (x - this.x)/this.scale, (y + lineHeight - this.y)/this.scale);
      
      const isAvailable = !(isInsideTop || isInsideBottom);

      if (isAvailable) {
        if (!currentSpan) {
          currentSpan = { x, width: 0 };
          spans.push(currentSpan);
        }
        currentSpan.width += step;
      } else {
        currentSpan = null;
      }
    }
    this.ctx.restore();

    return spans;
  }
}
