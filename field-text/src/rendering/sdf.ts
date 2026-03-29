
export function generateSDF(text: string, font: string, size = 64): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${size * 0.8}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(text, size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const sdf = new Uint8Array(size * size);

  // Naive distance field calculation
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const isInside = data[idx] > 128;
      
      let minDist = 256;
      for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const nidx = (ny * size + nx) * 4;
            const nIsInside = data[nidx] > 128;
            if (isInside !== nIsInside) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) minDist = dist;
            }
          }
        }
      }

      // Map to 0-255 range
      let val = isInside ? 128 + (minDist * 16) : 128 - (minDist * 16);
      sdf[y * size + x] = Math.max(0, Math.min(255, val));
    }
  }

  return sdf;
}
