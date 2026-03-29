import { PreparedText, LayoutConstraints, LayoutResult, LineLayout, GlyphSegment, BreakOpportunity } from '../types';

export function layout(prepared: PreparedText, constraints: LayoutConstraints): LayoutResult {
  const { segments, font } = prepared;
  const { maxWidth, lineHeight, textAlign = 'left' } = constraints;

  const lines: LineLayout[] = [];
  let currentY = 0;
  let currentLineSegments: GlyphSegment[] = [];
  let currentLineWidth = 0;

  function flushLine(isLastLine: boolean = false) {
    if (currentLineSegments.length === 0) return;
    
    // Trim trailing whitespace for width calculation
    let effectiveWidth = currentLineWidth;
    const lastSeg = currentLineSegments[currentLineSegments.length - 1];
    if (lastSeg?.isWhitespace) {
        effectiveWidth -= lastSeg.width;
    }

    let startX = 0;
    if (textAlign === 'center') {
      startX = (maxWidth - effectiveWidth) / 2;
    } else if (textAlign === 'right') {
      startX = maxWidth - effectiveWidth;
    }

    let textAlignToApply: string = textAlign;
    if (textAlign === 'justify' && (lastSeg.breakType === BreakOpportunity.HARD || isLastLine)) {
        textAlignToApply = 'left';
    }

    lines.push({
      segments: [...currentLineSegments],
      startX,
      y: currentY,
      width: effectiveWidth,
      targetWidth: maxWidth,
      baseline: currentY + lineHeight * 0.8,
      textAlign: textAlignToApply as any
    });

    currentY += lineHeight;
    currentLineSegments = [];
    currentLineWidth = 0;
  }

  for (const seg of segments) {
    // Check if it fits
    if (currentLineWidth + seg.width > maxWidth && currentLineSegments.length > 0) {
      flushLine(false);
    }

    currentLineSegments.push(seg);
    currentLineWidth += seg.width;

    if (seg.breakType === BreakOpportunity.HARD) {
      flushLine(false);
    }
  }

  flushLine(true);

  return {
    lines,
    totalHeight: currentY,
    maxWidth,
    font
  };
}
