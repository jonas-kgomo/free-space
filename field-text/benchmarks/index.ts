import { prepare, layout, renderToCanvas } from '../src/index';

const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 1024;
const ctx = canvas.getContext('2d')!;

function generateParagraphs(count: number) {
  const text = "Free Space performance test paragraph. ".repeat(10);
  return new Array(count).fill(text).join("\n\n");
}

function runBenchmark(count: number) {
  const text = generateParagraphs(count);
  const font = "16px sans-serif";
  const constraints = { maxWidth: 800, lineHeight: 20 };

  const start = performance.now();
  
  const t0 = performance.now();
  const prepared = prepare(text, font);
  const t1 = performance.now();
  
  const layoutResult = layout(prepared, constraints);
  const t2 = performance.now();
  
  renderToCanvas(ctx, layoutResult);
  const t3 = performance.now();

  const total = t3 - t0;
  
  return {
    count,
    prepareMs: t1 - t0,
    layoutMs: t2 - t1,
    renderMs: t3 - t2,
    totalMs: total,
    fps: 1000 / total,
    paragraphs: count
  };
}

const results = [
  runBenchmark(500),
  runBenchmark(5000),
  runBenchmark(50000)
];

console.table(results);
document.body.innerHTML = `<h1>Benchmarks</h1><pre>${JSON.stringify(results, null, 2)}</pre>`;
