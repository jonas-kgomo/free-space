import { PreparedText, GlyphSegment, BreakOpportunity } from '../types';

let canvasMemo: HTMLCanvasElement | null = null;
let ctxMemo: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D {
  if (!canvasMemo) {
    canvasMemo = document.createElement('canvas');
    ctxMemo = canvasMemo.getContext('2d');
  }
  return ctxMemo!;
}

// Segmentation logic
export function prepare(text: string, font: string): PreparedText {
  const ctx = getContext();
  ctx.font = font;

  // We'll segment by words/whitespace first.
  // Actually, we should probably segment into pieces that are "unbreakable" except at boundaries.
  // Intl.Segmenter is perfect here.
  const segmenter = new (Intl as any).Segmenter('und', { granularity: 'word' });
  const segments: GlyphSegment[] = [];

  let totalWidth = 0;
  let maxHeight = 0;

  for (const segment of segmenter.segment(text)) {
    const word = segment.segment;
    const metrics = ctx.measureText(word);
    
    // Determine break opportunity
    let breakType = BreakOpportunity.NONE;
    if (word.includes('\n')) {
      breakType = BreakOpportunity.HARD;
    } else if (segment.isWordLike || /\s/.test(word)) {
        breakType = BreakOpportunity.SOFT;
    }

    const glyphSeg: GlyphSegment = {
      text: word,
      width: metrics.width,
      ascent: metrics.actualBoundingBoxAscent,
      descent: metrics.actualBoundingBoxDescent,
      breakType,
      isWhitespace: /\s/.test(word)
    };

    segments.push(glyphSeg);
    totalWidth += glyphSeg.width;
    maxHeight = Math.max(maxHeight, glyphSeg.ascent + glyphSeg.descent);
  }

  return {
    text,
    font,
    segments,
    totalWidth,
    height: maxHeight
  };
}
