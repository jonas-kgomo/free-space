import { LayoutResult } from '../types';

export function renderToCanvas(ctx: CanvasRenderingContext2D, layout: LayoutResult): void {
  const { lines, font } = layout;

  ctx.font = font;
  ctx.textBaseline = 'alphabetic';

  for (const line of lines) {
    let currentX = line.startX;
    let extraSpacePerGap = 0;
    
    const wordCount = line.segments.filter(s => !s.isWhitespace).length;
    if (line.textAlign === 'justify' && wordCount > 1) {
        extraSpacePerGap = (line.targetWidth - line.width) / (wordCount - 1);
    }

    let wordsRendered = 0;
    for (const seg of line.segments) {
      ctx.fillText(seg.text, currentX, line.baseline);
      currentX += seg.width;
      
      if (line.textAlign === 'justify' && !seg.isWhitespace) {
          wordsRendered++;
          if (wordsRendered < wordCount) {
             currentX += extraSpacePerGap;
          }
      }
    }
  }
}

export function renderFieldHeatmap(ctx: CanvasRenderingContext2D, field: any, width: number, height: number): void {
  const isDark = document.documentElement.classList.contains('dark');
  const dotColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)';
  
  ctx.save();
  
  // 1. Draw a subtle global page vignette instead of per-shape halos
  const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Dots for available space
  const step = 20;
  for (let y = 0; y < height; y += step) {
    const spans = field.getAvailableSpans(y, 1);
    for (let x = 0; x < width; x += step) {
        const isAvailable = spans.some((s:any) => x >= s.x && x <= s.x + s.width);
        if (isAvailable) {
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
  }
  ctx.restore();
}

export function renderFieldOutlines(ctx: CanvasRenderingContext2D, field: any): void {
  const isDark = document.documentElement.classList.contains('dark');
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  const fields = field.fields || (field.a ? [field.a, field.b] : [field]);
  for (const f of fields) {
    if (!f) continue;
    if (typeof f.cx === 'number' && typeof f.cy === 'number' && typeof f.r === 'number') {
        ctx.beginPath();
        ctx.arc(f.cx, f.cy, f.r, 0, Math.PI * 2);
        ctx.stroke();
    } else if (f.points && Array.isArray(f.points)) {
        ctx.beginPath();
        ctx.moveTo(f.points[0].x, f.points[0].y);
        for (let i = 1; i < f.points.length; i++) {
            ctx.lineTo(f.points[i].x, f.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
    }
  }
  ctx.restore();
}

export function renderRaycast(ctx: CanvasRenderingContext2D, field: any, y: number, width: number): void {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 0.5;
    
    const spans = field.getAvailableSpans(y, 1);
    
    // Draw the "ray" from left to right
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Highlight the valid spans
    ctx.lineWidth = 2;
    for (const span of spans) {
        ctx.beginPath();
        ctx.moveTo(span.x, y);
        ctx.lineTo(span.x + span.width, y);
        ctx.stroke();
        
        // Draw interaction points
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(span.x, y, 3, 0, Math.PI * 2);
        ctx.arc(span.x + span.width, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

export function renderRayMarch(ctx: CanvasRenderingContext2D, field: any, y: number, width: number): void {
  ctx.save();
  const isDark = document.documentElement.classList.contains('dark');
  
  let x = 0;
  const maxSteps = 100;
  
  for(let i=0; i<maxSteps && x < width; i++) {
    const d = field.getSDF(x, y);
    const absD = Math.max(0.5, Math.abs(d));
    
    // Draw the "step" circle to visualize the sphere tracing / ray marching process
    ctx.beginPath();
    ctx.arc(x, y, absD, 0, Math.PI * 2);
    ctx.strokeStyle = d > 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Draw the point
    ctx.fillStyle = d > 0 ? '#6366f1' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    if (absD < 1) {
        // Jump over the boundary
        x += 2;
    } else {
        x += absD;
    }
  }
  ctx.restore();
}

export function renderLineBoundaries(ctx: CanvasRenderingContext2D, layout: any): void {
    ctx.save();
    ctx.lineWidth = 0.5;
    for (const line of layout.lines) {
        ctx.strokeStyle = 'rgba(94, 92, 230, 0.4)';
        ctx.strokeRect(line.startX, line.y, line.width, 24); // line height viz
    }
    ctx.restore();
}

export function renderVisibilityField(ctx: CanvasRenderingContext2D, field: any, lightX: number, lightY: number, radius: number): void {
  ctx.save();
  const isDark = document.documentElement.classList.contains('dark');
  const numRays = 180;
  
  ctx.beginPath();
  ctx.moveTo(lightX, lightY);
  
  for (let i = 0; i <= numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    
    let curX = lightX;
    let curY = lightY;
    let traveled = 0;
    const maxR = radius;
    
    for (let s = 0; s < 40; s++) {
        const d = field.getSDF(curX, curY);
        if (d < 0.5) break; 
        const step = Math.max(1, d);
        curX += dx * step;
        curY += dy * step;
        traveled += step;
        if (traveled >= maxR) {
            curX = lightX + dx * maxR;
            curY = lightY + dy * maxR;
            break;
        }
    }
    ctx.lineTo(curX, curY);
  }
  
  ctx.closePath();
  const grad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, radius);
  if (isDark) {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'transparent');
  } else {
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    grad.addColorStop(1, 'transparent');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

