import { ShapeField } from '../types';

export class CircleField implements ShapeField {
  constructor(
    public cx: number,
    public cy: number,
    public r: number,
    public maxWidth: number
  ) {}

  getSDF(x: number, y: number): number {
    return Math.sqrt((x - this.cx) ** 2 + (y - this.cy) ** 2) - this.r;
  }

  getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
    const r = this.r;
    const padding = 10;
    let dy: number;
    if (y <= this.cy && y + height >= this.cy) {
        dy = 0;
    } else {
        dy = Math.min(Math.abs(y - this.cy), Math.abs(y + height - this.cy));
    }
    
    if (dy > r) {
      return [{ x: 0, width: this.maxWidth }];
    }

    const dx = Math.sqrt(r * r - dy * dy) + padding;
    const leftX = this.cx - dx;
    const rightX = this.cx + dx;

    const spans = [];
    if (leftX > 0) {
      spans.push({ x: 0, width: Math.max(0, leftX) });
    }
    if (rightX < this.maxWidth) {
      spans.push({ x: rightX, width: Math.max(0, this.maxWidth - rightX) });
    }

    return spans;
  }
}

export class MultiShapeField implements ShapeField {
  constructor(
    public fields: ShapeField[],
    public maxWidth: number
  ) {}

  getSDF(x: number, y: number): number {
    let minD = Infinity;
    for (const f of this.fields) {
        const d = (f as any).getSDF ? (f as any).getSDF(x, y) : 1000;
        if (d < minD) minD = d;
    }
    return minD === Infinity ? 1000 : minD;
  }

  getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
    let currentSpans = [{ x: 0, width: this.maxWidth }];
    for (const field of this.fields) {
      const fieldSpans = field.getAvailableSpans(y, height);
      const nextSpans: { x: number; width: number }[] = [];
      for (const span of currentSpans) {
        for (const fSpan of fieldSpans) {
          const start = Math.max(span.x, fSpan.x);
          const end = Math.min(span.x + span.width, fSpan.x + fSpan.width);
          if (end > start) {
            nextSpans.push({ x: start, width: end - start });
          }
        }
      }
      currentSpans = nextSpans;
    }
    return currentSpans;
  }

  getFields() { return this.fields; }
}

export class ShapeUnionField implements ShapeField {
  constructor(public a: ShapeField, public b: ShapeField, public maxWidth: number) {}
  
  getSDF(x: number, y: number): number {
    const da = (this.a as any).getSDF ? (this.a as any).getSDF(x, y) : 1000;
    const db = (this.b as any).getSDF ? (this.b as any).getSDF(x, y) : 1000;
    return Math.min(da, db);
  }

  getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
    const spansA = this.a.getAvailableSpans(y, height);
    const spansB = this.b.getAvailableSpans(y, height);
    const result: { x: number; width: number }[] = [];
    for (const sA of spansA) {
        for (const sB of spansB) {
            const start = Math.max(sA.x, sB.x);
            const end = Math.min(sA.x + sA.width, sB.x + sB.width);
            if (end > start) {
                result.push({ x: start, width: end - start });
            }
        }
    }
    return result;
  }
}

export function mergeSpans(a: { x: number; width: number }[], b: { x: number; width: number }[]): { x: number; width: number }[] {
    const combined = [...a, ...b].sort((s1, s2) => s1.x - s2.x);
    if (combined.length === 0) return [];
    const merged = [combined[0]];
    for (let i = 1; i < combined.length; i++) {
        const last = merged[merged.length - 1];
        const current = combined[i];
        if (current.x <= last.x + last.width) {
            last.width = Math.max(last.width, current.x + current.width - last.x);
        } else {
            merged.push(current);
        }
    }
    return merged;
}

export class ShapeIntersectionField implements ShapeField {
    constructor(public a: ShapeField, public b: ShapeField, public maxWidth: number) {}
    
    getSDF(x: number, y: number): number {
        const da = (this.a as any).getSDF ? (this.a as any).getSDF(x, y) : 1000;
        const db = (this.b as any).getSDF ? (this.b as any).getSDF(x, y) : 1000;
        return Math.max(da, db);
    }

    getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
        const spansA = this.a.getAvailableSpans(y, height);
        const spansB = this.b.getAvailableSpans(y, height);
        return mergeSpans(spansA, spansB);
    }
}

export class SmoothUnionField implements ShapeField {
    constructor(
        public sdfA: (x: number, y: number) => number,
        public sdfB: (x: number, y: number) => number,
        public k: number,
        public threshold: number,
        public maxWidth: number,
        public step: number = 2
    ) {}

    getSDF(x: number, y: number): number {
        const d1 = this.sdfA(x, y);
        const d2 = this.sdfB(x, y);
        const h = Math.max(this.k - Math.abs(d1 - d2), 0) / this.k;
        return Math.min(d1, d2) - h * h * this.k * 0.25;
    }

    getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
        const spans: { x: number; width: number }[] = [];
        let currentSpan: { x: number; width: number } | null = null;
        for (let x = 0; x < this.maxWidth; x += this.step) {
            const dist = this.getSDF(x, y);
            const isInside = dist > this.threshold;
            if (isInside) {
                if (!currentSpan) {
                    currentSpan = { x, width: 0 };
                    spans.push(currentSpan);
                }
                currentSpan.width += this.step;
            } else {
                currentSpan = null;
            }
        }
        return spans;
    }
}

export class SDFField implements ShapeField {
  constructor(
    public sdf: (x: number, y: number) => number,
    public threshold: number,
    public maxWidth: number,
    public step: number = 2
  ) {}

  getSDF(x: number, y: number): number {
    return this.sdf(x, y);
  }

  getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
    const spans: { x: number; width: number }[] = [];
    let currentSpan: { x: number; width: number } | null = null;
    for (let x = 0; x < this.maxWidth; x += this.step) {
      const distTop = this.sdf(x, y);
      const distBottom = this.sdf(x, y + height);
      const isInside = Math.min(distTop, distBottom) > this.threshold;
      if (isInside) {
        if (!currentSpan) {
          currentSpan = { x, width: 0 };
          spans.push(currentSpan);
        }
        currentSpan.width += this.step;
      } else {
        currentSpan = null;
      }
    }
    return spans;
  }
}

export class PolygonField implements ShapeField {
    constructor(
        public points: { x: number; y: number }[],
        public maxWidth: number,
        public step: number = 2
    ) {}

    getSDF(x: number, y: number): number {
        return this.isPointInPolygon(x, y) ? -20 : 20;
    }

    getAvailableSpans(y: number, height: number): { x: number; width: number }[] {
        const spans: { x: number; width: number }[] = [];
        let currentSpan: { x: number; width: number } | null = null;
        for (let x = 0; x < this.maxWidth; x += this.step) {
            const available = !this.isPointInPolygon(x, y) && !this.isPointInPolygon(x, y + height);
            if (available) {
                if (!currentSpan) {
                    currentSpan = { x, width: 0 };
                    spans.push(currentSpan);
                }
                currentSpan.width += this.step;
            } else {
                currentSpan = null;
            }
        }
        return spans;
    }

    private isPointInPolygon(x: number, y: number): boolean {
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i].x, yi = this.points[i].y;
            const xj = this.points[j].x, yj = this.points[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}

export class BoxField implements ShapeField {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public radius: number,
    public maxWidth: number,
    public step: number = 2
  ) {}

  getSDF(px: number, py: number): number {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = Math.abs(px - cx) - (this.w / 2 - this.radius);
    const dy = Math.abs(py - cy) - (this.h / 2 - this.radius);
    const outside = Math.sqrt(Math.max(dx, 0)**2 + Math.max(dy, 0)**2);
    const inside = Math.min(Math.max(dx, dy), 0);
    return outside + inside - this.radius;
  }

  getAvailableSpans(py: number, lineH: number): { x: number; width: number }[] {
    const spans: { x: number; width: number }[] = [];
    let currentSpan: { x: number; width: number } | null = null;
    for (let px = 0; px < this.maxWidth; px += this.step) {
      const d1 = this.getSDF(px, py);
      const d2 = this.getSDF(px, py + lineH);
      const isOutside = Math.min(d1, d2) > 0.5;
      if (isOutside) {
        if (!currentSpan) {
          currentSpan = { x: px, width: 0 };
          spans.push(currentSpan);
        }
        currentSpan.width += this.step;
      } else {
        currentSpan = null;
      }
    }
    return spans;
  }
}
