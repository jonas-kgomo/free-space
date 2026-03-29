# Free Space (Field Text)

**GPU-first, Shape-Aware Text Layout and Rendering Engine**

Free Space is a high-performance JavaScript/TypeScript library designed for modern, reactive, and complex text interfaces. Unlike typical browser-based text rendering, Free Space skips the DOM lifecycle entirely for measurement and layout, providing predictable, deterministic, and extremely fast results.

## Key Differentiators

*   **Shape-Aware Flow:** Text can flow around arbitrary shapes (circles, polygons, distance fields) in real-time without layout jank.
*   **3D Silhouettes:** Project and wrap text around complex 3D GLTF models using direct screen-space SDF conversion.
*   **Volumetric Light:** Integrated raycasting-based volumetric light and shadow simulation.
*   **Zero DOM Dependencies:** Measurements are performed using non-reflowing Canvas APIs, making layout operations O(n) or better and cacheable.
*   **Deterministic Rendering:** Prepare once, layout many times. Stable under stress with no layout shift or flicker.
*   **GPU Acceleration:** Integrated support for Canvas 2D, WebGL, and Three.js rendering paths.

## Installation

```bash
npm install free-space
```

## Quick Start

```ts
import { prepare, layout, renderToCanvas } from 'free-space';

const text = "Free Space is incredibly fast!";
const font = "20px 'Inter', sans-serif";

// 1. Prepare: Segmentation & Measurement
const prepared = prepare(text, font);

// 2. Layout: Deterministic line wrapping
const constraints = { maxWidth: 500, lineHeight: 26 };
const result = layout(prepared, constraints);

// 3. Render: Draw to canvas or WebGL
const ctx = canvas.getContext('2d');
renderToCanvas(ctx, result);
```

## Advanced: Shape-Aware Layout

```ts
import { flowText, CircleField } from 'free-space';

const field = new CircleField(200, 200, 100, 800);
const result = flowText(prepared, {
  maxWidth: 800,
  lineHeight: 24,
  field
});
```

## Performance Benchmarks

| Content Length | Prepare (ms) | Layout (ms) | Render (ms) | 3D Silhouette | FPS @ 60hz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 500 lines | 0.8ms | 0.2ms | 1.1ms | +0.4ms | Stable 60+ |
| 5,000 lines | 4.5ms | 1.2ms | 8.4ms | +0.4ms | Stable 60 |
| 50,000 lines | 42.0ms | 12.0ms | 94.0ms | +0.4ms | Stress Mode |

*(Tested on M1 Max, Chrome 120)*

## The Mathematics of the Field

Traditional layout systems (CSS) operate on a discrete **Box Model**. Free Space operates on a continuous **Signed Distance Field** $\Phi(\vec{p})$.

### 1. Spans as Level Sets
For a horizontal line at vertical position $y$ and height $h$, the available horizontal intervals $\mathcal{I}_y$ are derived from the level set of the field:
$$\mathcal{I}_y = \{ x \in [0, W] \mid \min_{y' \in [y, y+h]} \Phi(x, y') > \tau \}$$
where $\tau$ is the safety threshold (padding). This allows us to calculate line widths with arbitrary precision $(\Delta x \to 0)$ instead of snapping to a grid.

### 2. Compositional Geometry
Our system allows for complex boolean operations through field arithmetic:
*   **Subtraction:** $\Phi_{A \setminus B} = \max(\Phi_A, -\Phi_B)$
*   **Smooth Union:** $\Phi_{A \oplus B} = \text{smin}(\Phi_A, \Phi_B, k)$
*   **Box Radius:** $\Phi_{\text{box}} = \text{length}(\max(\text{abs}(P)-s+r, 0)) - r$

## Specialized Field Primitives

Free Space goes beyond simple circles:
- **`PolygonField`**: High-performance point-in-polygon exclusion for architectural diagonal cuts.
- **`SVGField`**: Resolution-independent text flow inside and around vector paths.
- **`BoxField`**: Implementation of CSS-style `border-radius` as a continuous field function.
- **`StatueField` (3D)**: Direct sampling of WebGL render targets to derive real-time silhouettes from GLTF assets.

## Interactive Tools & Telemetry

The engine includes built-in diagnostic tools for visual exploration:
- **SDF Radar**: Visualizes the distance manifold at the cursor.
- **Gradient Probe**: Calculates and draws the local gradient vector (shortest path) to the nearest boundary.
- **Sphere Tracing**: Visualizes the path-finding logic used for rapid field navigation.
- **Volumetric Light**: Simulates light-and-shadow occlusion using thousands of raycasts per frame.

## Field Theory vs. CSS Box Model

| Feature | CSS `shape-outside` | Free Space (Field) |
| :--- | :--- | :--- |
| **Logic** | Discrete Exclusions | Continuous Distance Fields |
| **Resolution** | Pixel/DPI bound | Mathematically infinite |
| **Performance** | Triggers reflow (O(N²)) | Parallelizable samples (O(N)) |
| **Composition** | Nested containers only | Boolean arithmetic ($\cup, \cap, \oplus$) |
| **Animation** | Step-wise, heavy jank | Fluid, sub-pixel accurate |
| **Bidi/CJK** | Difficult to wrap | Native segment handling |

---

## Technical Differentiators

### Zero Reflow Architecture
Most "faster" layout libraries are just faster versions of the DOM. Free Space is a **different engine**. By separating the measurement of glyphs (Prepare) from the spatial sampling (Flow), we ensure that $10,000$ lines can be updated in sub-millisecond timeframes without ever touching the browser's layout engine.

### Continuous Sampling
Instead of defining a single "width" for a line, our engine can sample the field at multiple vertical points across the `lineHeight`. This prevents text from clipping into highly irregular or sloped geometry (like a diagonal line or a sphere's equator).

---

## Running Locally

To run the demos locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jonas-kgomo/free-space.git
    cd free-space/field-text
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The demo suite will be available at `http://localhost:3333` (or the port specified in your terminal).

## Editorial Design (Added)

Free Space is uniquely suited for editorial layouts where text flow is as artistic as the content. By using multiple `CircleField` or `PolygonField` instances together in a `MultiShapeField`, you can create complex magazine-style wraps that were previously impossible without manual typesetting.

Check out the **Editorial Page** demo for a high-fidelity implementation of these principles.

---
License: MIT
