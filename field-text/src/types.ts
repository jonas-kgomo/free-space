
export enum BreakOpportunity {
  NONE,
  SOFT, // can break
  HARD, // must break (newline)
}

export interface GlyphSegment {
  text: string;
  width: number;
  ascent: number;
  descent: number;
  breakType: BreakOpportunity;
  isWhitespace: boolean;
}

export interface PreparedText {
  text: string;
  font: string;
  segments: GlyphSegment[];
  totalWidth: number;
  height: number;
}

export interface LayoutConstraints {
  maxWidth: number;
  lineHeight: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface LineLayout {
  segments: GlyphSegment[];
  startX: number;
  y: number;
  width: number;
  targetWidth: number;
  baseline: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface LayoutResult {
  lines: LineLayout[];
  totalHeight: number;
  maxWidth: number;
  font: string;
}

// Distance Field / Geometry Map interface
export interface ShapeField {
  // Returns the maximum available horizontal gaps at (y) with (height).
  // Ideally, this returns an array of spans (intervals) of available space.
  getAvailableSpans(y: number, height: number): { x: number; width: number }[];
}

export interface FlowOptions extends LayoutConstraints {
  field: ShapeField;
}
