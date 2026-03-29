import { PreparedText, LayoutResult, LineLayout, GlyphSegment, BreakOpportunity, FlowOptions } from '../types';

export function flowText(prepared: PreparedText, options: FlowOptions): LayoutResult {
  const { segments, font } = prepared;
  const { maxWidth, lineHeight, field, textAlign = 'left' } = options;

  const results: LineLayout[] = [];
  let currentY = 0;
  let segIndex = 0;

  let safetyCounter = 0;
  const maxLines = 2000;

  while (segIndex < segments.length && safetyCounter < maxLines) {
    safetyCounter++;
    
    // Get available intervals for this Y
    const intervals = field.getAvailableSpans(currentY, lineHeight);
    
    if (intervals.length === 0) {
      currentY += lineHeight;
      continue;
    }

    let progressInThisLine = false;
    for (const interval of intervals) {
      if (segIndex >= segments.length) break;

      const currentLineSegments: GlyphSegment[] = [];
      let currentLineWidth = 0;

      // Fill this span
      while (segIndex < segments.length) {
        const seg = segments[segIndex];
        
        if (currentLineWidth + seg.width > interval.width) {
          if (currentLineSegments.length > 0) break;
          else {
              // Word is too long for span. Skip this word to avoid infinite loop
              // Or skip span. Let's skip span for now but if it's the only span, we must skip word.
              if (intervals.length === 1) {
                  segIndex++; // Skip the impossible word
              }
              break;
          }
        }

        currentLineSegments.push(seg);
        currentLineWidth += seg.width;
        segIndex++;
        progressInThisLine = true;

        if (seg.breakType === BreakOpportunity.HARD) {
          break;
        }
      }

      if (currentLineSegments.length > 0) {
        let startX = interval.x;
        if (textAlign === 'center') {
            startX += (interval.width - currentLineWidth) / 2;
        } else if (textAlign === 'right') {
            startX += (interval.width - currentLineWidth);
        }

        results.push({
          segments: currentLineSegments,
          startX,
          y: currentY,
          width: currentLineWidth,
          targetWidth: interval.width,
          baseline: currentY + lineHeight * 0.8,
          textAlign: (currentLineSegments[currentLineSegments.length-1]?.breakType === BreakOpportunity.HARD ? 'left' : textAlign) as any
        });
        
        if (currentLineSegments[currentLineSegments.length-1]?.breakType === BreakOpportunity.HARD) {
            break;
        }
      }
    }

    currentY += lineHeight;
  }

  return {
    lines: results,
    totalHeight: currentY,
    maxWidth,
    font
  };
}
