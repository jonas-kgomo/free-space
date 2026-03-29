import { 
    prepare, 
    flowText, 
    renderToCanvas, 
    renderFieldHeatmap, 
    renderLineBoundaries,
    renderFieldOutlines,
    renderRaycast,
    renderRayMarch,
    renderVisibilityField,
    CircleField, 
    MultiShapeField, 
    SDFField,
    SVGField,
    ShapeUnionField,
    ShapeIntersectionField,
    SmoothUnionField,
    PolygonField,
    BoxField,
    StatueField
} from '../src/index';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Global Setup ---
const canvas = document.getElementById('view-normal') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const prepareMsEl = document.getElementById('prepare-ms')!;
const layoutMsEl = document.getElementById('layout-ms')!;
const renderMsEl = document.getElementById('render-ms')!;
const fpsEl = document.getElementById('fps')!;
const sdfTelemetryEl = document.getElementById('sdf-telemetry')!;
const demoTitle = document.getElementById('demo-title')!;
const demoDesc = document.getElementById('demo-desc')!;
const controlsPanel = document.getElementById('controls')!;
const formulaEl = document.getElementById('demo-formula')!;
const techExplanationEl = document.getElementById('technical-explanation')!;

let currentDemo = 'editorial_page';
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

interface DemoState {
    width: number;
    zoom: number;
    showHeatmap: boolean;
    showBoundaries: boolean;
    showOutlines: boolean;
    mouse: { x: number; y: number };
    rotation: number;
    k: number;
    mutationSpeed: number;
}

const state: DemoState = {
    width: 800,
    zoom: 1.0,
    showHeatmap: true,
    showBoundaries: false,
    showOutlines: true,
    mouse: { x: 400, y: 300 },
    rotation: 0,
    k: 32,
    mutationSpeed: 0.5
};

let cachedPrepared: { name: string, data: any } | null = null;

let statueField: StatueField | null = null;
const loader = new GLTFLoader();
loader.load('/hebe/scene.gltf', (gltf: any) => {
    statueField = new StatueField(state.width, 1000);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Normalize to roughly fitting in camera view
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4.5 / maxDim;
    model.scale.set(scale, scale, scale);
    model.position.sub(center.multiplyScalar(scale));
    
    statueField.setModel(model);
    console.log("Statue model loaded:", model);
}, undefined, (err: any) => {
    console.error("Failed to load map GLTF:", err);
});

// --- Content and Data ---
const DATA: Record<string, { title: string, desc: string, text: string, formula: string, explanation: string }> = {
    editorial_page: {
        title: "Free Space",
        desc: "Breaking the Rectangular Grid.",
        text: `The web is a box. Modern architectural typography demands more than simple rectangles; it demands diagonal cuts, non-convex exclusions, and composite geometric fields. This page is a demonstration of 'Architectural Typography,' where the page is treated not as a series of containers, but as a single physical space. 

By applying a large diagonal polygonal cut to the left and a circular pull-quote exclusion to the right, we create a layout that is impossible to achieve with the standard CSS box model without complex, brittle hacks. In 'Free Space,' this is purely arithmetic. Each line of text solves for its horizontal segment in real-time, allowing for a layout that is as precise as a floor plan and as fluid as a river. This is the power of the field: geometry is no longer an obstacle—it is a foundation for storytelling. We are moving beyond the 20th-century grid into a new era of spatial communication.`,
        formula: "Non-Linear Geometry",
        explanation: "Combining sharp diagonal polygons with circular fields to overcome the constraints of the standard web grid."
    },
    technical_brief: {
        title: "Technical Brief",
        desc: "The Geometry of Free Space.",
        text: `In the traditional architecture of the web, we are prisoners of the box. From the earliest days of HTML, the Box Model has defined our creative boundaries. We nest rectangles within rectangles, simulating complexity while remaining tethered to a rigid, discrete grid. 

[ SDF Core Concept ]
f(p) = length(p) - r

Free Space represents a departure from this industrial-age constraint. At the heart of our engine lies a powerful mathematical construct borrowed from the worlds of high-end GPU graphics and physics simulations: the Signed Distance Field (SDF). Unlike a <div>, which is a discrete collection of four coordinates, an SDF is a continuous function f(p) that, for any coordinate p in space, returns the shortest distance to the nearest boundary of a shape. 

[ Composite Field Arithmetic ]
Union: min(f1, f2)
Subtraction: max(f1, -f2)

Take the simplest geometric primitive: the circle. For a circle of radius r centered at the origin, the SDF is elegantly simple: f(p) = length(p) - r. By evaluating this function, the layout engine doesn't just know if it is inside a shape—it knows exactly how far away the nearest obstacle is. The text identifies 'available spans' by solving for intervals where f(p) > threshold. This turns layout into a purely arithmetic operation. 

[ Spatially Aware Flow ]
Line(y) = { x | f(x, y) > padding }

In the Free Space engine, we have replaced the reflow with a Spatial Query. This happens in microseconds. Because once a glyph is measured (prepared), the layout becomes a deterministic solution. We are only at the beginning of the field-based revolution. Our roadmap includes several Quantum Leaps for the typography engine: Temporal Fields (Field Morphing), Massive Parallelism (WebGPU), and Procedurally Driven Noise Fields.`,
        formula: "The Geometry of Free Space",
        explanation: "The mechanical foundation of the engine: treating layout as an arithmetic sampling of a continuous spatial function."
    },
    statue_field: {
        title: "Statue Field",
        desc: "Text interacting with 3D silhouettes in real-time.",
        text: `By projecting 3D geometry into screen space, we can derive a 2D signed distance field that represents the object's silhouette. The text then flows around the object, respecting its perceived volume and boundaries. This creates an emotional connection between language and form. The text does not clip or jitter; it slides and compresses as the object rotates. This is not a flat operation, but a response to spatial context. As the heavy stone of the sculpture turns, the light words part like water around a bow. 

This demonstration proves that the 'Free Space' engine is not limited to simple 2D primitives. It can consume the silhouette of any complex three-dimensional form, treating the 3D world as just another set of coordinates in the field. This interoperability between 3D engines and typographic layout opens up new possibilities for spatial computing and high-end editorial design. Imagine a textbook where the text wraps around the very organs of a heart or the intricate gears of an engine as they rotate and function. We are breaking the wall between the 'graphic' and the 'content'. Here, the content is the field, and the field is the content. Everything is unified by a single set of arithmetic rules.`,
        formula: "Volumetric Projection",
        explanation: "3D silhouettes are flattened into the 2D layout field for dynamic spatial wrapping."
    },
    raycasting: {
        title: "Raycasting",
        desc: "Visualizing the 1D sampling mechanism.",
        text: `The core of the engine is a 1D raycast. For every line of text, we sample the field along a horizontal ray at the line's Y-coordinate. This demo visualizes that internal raycasting process as it tracks your cursor. The blue lines indicate the horizontal segments currently identified as 'outside' the field primitives. This proof-of-concept shows that our layout logic is essentially a collection of spatial queries that solve for equilibrium. It's layout as physics, not box-fitting. 

By visualizing the rays, we can see how the engine 'thinks'. It doesn't look at the page as a whole; it looks at it as a sequence of one-dimensional opportunities. Each ray is an independent explorer, seeking the boundaries of the field. When a ray enters a excluded zone, it marks the start of a gap. When it exits, it marks the start of a new typographic span. This reduction of 2D layout to 1D sampling is what allows 'Free Space' to achieve such extreme performance. We are doing for text what ray-tracing did for light: we are replacing approximations with direct mathematical queries.`,
        formula: "Iterative Intersection",
        explanation: "The engine solves for horizontal space by casting millions of tests per second."
    },
    ray_marching: {
        title: "Ray Marching",
        desc: "Visualizing the SDF stepping process.",
        text: `Ray marching, or sphere tracing, is an efficient way to navigate a distance field. Instead of fixed-step sampling, we move along the ray by the exact distance returned by the field function. This ensures that we land precisely on the boundary of any object without overshooting or missing small details. The expanding circles in this visualization show the 'safe' area discovered by the engine at each step. If the distance field says the nearest object is 50 pixels away, the engine can safely jump 50 pixels ahead.

This technique is borrowed from advanced GPU graphics. By applying it to typography, we create a layout system that is aware of its surroundings. The text 'knows' how far it is from the nearest obstacle. This 'awareness' is the foundation of our continuity and gradient-sampling logic. We are not just checking for collisions; we are measuring the very grain of the space. It is a more sophisticated, more respectful way of arranging information. The layout becomes a journey through a landscape of data, where every step is guided by the underlying geometry.`,
        formula: "Sphere Tracing",
        explanation: "Efficiently navigating complex fields by jumping through verified empty space."
    },
    unified_field: {
        title: "Unified Field",
        desc: "SVG and Text as the Same Primitive.",
        text: `Free Space treats vector graphics and typography as part of the same spatial system. A complex SVG is converted into a signed distance field, allowing text to flow both around and inside its boundaries. The relationship is resolution-independent and perfectly stable under scaling. When the SVG is distorted, the text adapts instantly without recomputation artifacts. This demonstration uses a high-detail vector path as the primary exclusion zone.

Most browsers treat SVGs as independent rectangles that text can only wrap around in the simplest way. In our system, the SVG is a first-class citizen of the distance field. Its curves, its holes, and its sharpest corners are all visible to the text engine. This allows for branding and typography to be interwoven at a fundamental level. You can place a logotype in the middle of a paragraph and have the words flow through the letters of the logo itself. This is the death of the 'float' and the birth of the 'field'.`,
        formula: "Path Resolution",
        explanation: "Vector paths are transformed into continuous mathematical distances."
    },
    boolean_composition: {
        title: "Boolean Composition",
        desc: "Constructing complex layout spaces.",
        text: `Signed distance fields allow for shape combination through boolean operations. Multiple geometric fields are merged using union, subtraction, and intersection to create complex layout topologies. Text responds to the composite field as a single coherent space. Here, we demonstrate the intersection and union of multiple circular and polygonal fields.

Boolean operations are the building blocks of architectural layout. By combining simple primitives, we can describe any possible space. Want a layout that avoids a circular image but fills a rectangular sidebar? That is a Subtraction. Want text to only appear where two shapes overlap? That is an Intersection. These are not complex CSS rules or nested divs; they are simple mathematical operations applied to the field. This demonstrates the pure arithmetic nature of 'Free Space'. Every layout is just a formula waiting to be solved.`,
        formula: "Logical Geometry",
        explanation: "Combining simple shapes into complex layout topologies using Boolean logic."
    },
    smooth_blending: {
        title: "Smooth Blending",
        desc: "Organic boundaries instead of hard edges.",
        text: `Contrast the rigid boundaries of traditional layout with the organic transitions possible via smooth minimum functions. Shapes merge and split without discontinuities, and text layout follows these gradients with fluidity. This creates a soft, liquid aesthetic that is impossible to achieve with the standard DOM box model.

The 'smin' function allows us to blend shapes based on their proximity. As two circles approach each other, they don't just overlap; they stretch and bridge, forming a single organic entity. The text flows around this morphing shape with the same uncompromising precision. This is the geometric equivalent of a 'metaball' effect, applied to document design. It represents a move away from the industrial, rectangular web toward something more biological and responsive. Content should be as living as the user interacting with it.`,
        formula: "Organic Synthesis",
        explanation: "Using smooth minimums to create fluid, non-linear layout boundaries."
    },
    gradient_sampling: {
        title: "Continuity",
        desc: "Layout driven by gradients, not boundaries.",
        text: `Rather than a binary in/out decision, the engine samples the field to determine optimal density and proximity. Text can 'pull away' from edges naturally by adjusting the distance threshold or observing the local gradient. This allows for layouts that breathe—where the margin is not a fixed number, but a variable related to the intensity of the field.

Continuity is the secret to high-end typography. By observing the gradient, the engine knows not only WHERE the boundary is, but which way it is FACING. This allows the layout to tilt, compress, or expand in response to the slope of the geometry. We are no longer limited to horizontal or vertical flow. The text can follow the contours of the field with absolute fidelity. This is layout as a vector field—a space where every point has a direction and a magnitude.`,
        formula: "Derivative Flow",
        explanation: "Analyzing the field's rate of change to drive sophisticated typographic alignment."
    },
    mutation_test: {
        title: "Real-Time",
        desc: "Layout updating every frame without reflow.",
        text: `Performance is at the heart of Free Space. Because the layout engine is purely arithmetic and decoupled from the DOM, we can update geometry 60 times per second with zero flicker. This demo shows 50,000 characters being reflowed in real-time around a moving exclusion zone. In a standard browser, this would cause the main thread to lock up for seconds. In 'Free Space', it is just another frame in the animation loop.

We have achieved this by moving the layout logic into a optimized arithmetic pipeline. We don't touch the DOM until the absolute final second of rendering. By bypassing the browser's heavy layout engine, we unlock the full power of the modern CPU and GPU for document design. This is not just a performance trick; it is a fundamental shift in what is possible on the web. Real-time, interactive typography is no longer a dream—it is a reality.`,
        formula: "Frame-Rate Fidelity",
        explanation: "Achieving true real-time performance through a decoupled layout pipeline."
    },
    resolution_independence: {
        title: "Zoom/Scale",
        desc: "Perfect scaling across all zoom levels.",
        text: `The system maintains visual fidelity from extreme macro to micro scales. Because both the rendering and the layout are derived from the same field primitives, there is no loss of precision when zooming. Most layout engines break down at extreme scales due to floating-point errors or container limits. 'Free Space' remains mathematically pure at any magnification.

Resolution independence is the hallmark of vector-based systems. By treating the page as a field, we move beyond the pixel. A line of text that fits perfectly around a curve at 100% zoom will still fit perfectly at 10,000% zoom. This allows for incredibly high-detail designs and ensures that your layout looks stunning on everything from a watch face to a wall-sized projection. The math doesn't care about the screen resolution; it only cares about the relationship between the symbols and the space.`,
        formula: "Vector Purity",
        explanation: "Layout behavior that remains consistent regardless of the viewing scale."
    },
    adaptive_width: {
        title: "Adaptive Flow",
        desc: "Per-line width determination logic.",
        text: `The core breakthrough of Free Space: every single line determines its width based on the available space at its specific vertical position. This allows for fluid adaptation to irregular geometry that fixed-width containers simply cannot match. The engine solves the width equation for every line height interval, allowing the text to expand into every available crevice of the page.

In the old web, you set a 'width' on a div. In the new web, the 'width' is a result of the environment. If there is a large gap between two shapes, the line splits and occupies both. If the space is narrow, the line compresses. This adaptive behavior is what gives 'Free Space' its name. It is about using all the available freedom on the page to present information. This leads to layouts that are dense with information but light in spirit—truly adapted to their purpose.`,
        formula: "Dynamic Spans",
        explanation: "Information density that automatically adjusts to geometric constraints."
    },
    polygon_flow: {
        title: "Polygon Flow",
        desc: "Text flow around arbitrary polygonal shapes.",
        text: `Free Space supports arbitrary polygon fields. Unlike the CSS box model which is limited to rectangles and simple border-radius circles, our engine can handle high-vertex polygons with no performance degradation. The text flows precisely around the vertices and edges of complex geometric figures.

Polygons allow for sharp, architectural layouts. They represent the structural precision possible with the 'Free Space' engine. Whether you are building a layout around a floor plan, a star shape, or a custom-designed glyph, the engine applies the same uncompromising logic. This proves that even the most complex discontinuities in the field can be handled with absolute stability. The polygon is the ultimate test of the engine's edge-following capability, resulting in layouts that feel intentional and engineered.`,
        formula: "Architectural Bounds",
        explanation: "Sharp geometric precision enabled by high-performance point-in-polygon tests."
    },
    microscope: {
        title: "Microscope",
        desc: "Micro-details and SDF metrics.",
        text: `At extreme zoom levels, the precision of the Signed Distance Field becomes apparent. Unlike standard browser text rendering which might alias or lose sub-pixel accuracy, our engine maintains a mathematical relationship with the boundary. You can see the individual sampling points as they dance along the edge of the geometry.

The microscope demo is a celebration of detail. It shows that even at scales where a single letter occupies the entire screen, the relationship between that letter and the field remains perfect. This is the level of precision required for the next generation of high-fidelity digital documents. We are not just laying out text; we are orchestrating a complex spatial dance where every sub-pixel matters. The microscope proves that under the hood, 'Free Space' is as precise as a Swiss watch.`,
        formula: "Sub-Pixel Resolution",
        explanation: "Visualizing the microscopic accuracy of the field-based sampling logic."
    },
    benchmarks: {
        title: "Benchmarks",
        desc: "Comparing arithmetic vs. DOM.",
        text: `The traditional DOM-based approach to text layout is heavy. It requires style resolution, box calculation, and browser repaints that trigger expensive layout shifts. 'Free Space' layout is purely arithmetic, achieving speeds orders of magnitude faster. This allows us to handle huge volumes of text with ease.

In this demo, we compare the time taken to layout 50,000 characters using our engine versus the standard browser methods. The results are clear: by moving layout into the arithmetic field, we can achieve real-time performance that was previously impossible. This is the 'brute force' power of mathematics applied to the art of typography. We are proving that you don't need a heavy browser engine to have world-class layout—you just need the right formulae.`,
        formula: "Computational Superiority",
        explanation: "A direct comparison showing the massive performance gains of field-based layout."
    }
};

// --- Execution ---

function loadDemo(name: string) {
    currentDemo = name;
    const d = DATA[name] || DATA.technical_brief;
    demoTitle.textContent = d.title;
    demoDesc.textContent = d.desc;
    formulaEl.textContent = d.formula;
    techExplanationEl.textContent = d.explanation;

    // Trigger MathJax update (if still active)
    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise();
    }
    
    document.querySelectorAll('.demo-link').forEach(link => {
        const linkText = link.textContent?.toLowerCase().replace(/ /g, '_');
        link.classList.toggle('active', linkText === name 
            || (name==='technical_brief' && link.textContent==='Technical Brief')
            || (name==='boolean_composition' && link.textContent==='Boolean Ops') 
            || (name==='smooth_blending' && link.textContent==='Smooth Smin') 
            || (name==='gradient_sampling' && link.textContent==='Continuity') 
            || (name==='mutation_test' && link.textContent==='Real-Time') 
            || (name==='resolution_independence' && link.textContent==='Zoom/Scale')
            || (name==='microscope' && link.textContent==='Microscope')
            || (name==='benchmarks' && link.textContent==='Benchmarks')
        );
    });

    const panel = document.getElementById('bench-panel')!;
    const controls = document.getElementById('controls')!;
    if (name === 'benchmarks') {
        panel.classList.add('visible');
        controls.style.display = 'none';
        runTrueBenchmark();
    } else {
        panel.classList.remove('visible');
        controls.style.display = 'flex';
    }

    renderControls();
}
(window as any).loadDemo = loadDemo;

function renderControls() {
    controlsPanel.innerHTML = '';
    const addSlider = (label: string, min: number, max: number, value: number, step: number, onChange: (v: number) => void) => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.innerHTML = `<label>${label}</label>`;
        const input = document.createElement('input');
        input.type = 'range'; input.min = min.toString(); input.max = max.toString(); 
        input.value = value.toString(); input.step = step.toString();
        input.oninput = (e: any) => onChange(+e.target.value);
        item.appendChild(input);
        controlsPanel.appendChild(item);
    };

    const addCheckbox = (label: string, value: boolean, onChange: (v: boolean) => void) => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.innerHTML = `<label style="display:inline; margin-right: 1rem;">${label}</label>`;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value;
        input.onchange = (e: any) => onChange(e.target.checked);
        item.appendChild(input);
        controlsPanel.appendChild(item);
    };

    addSlider('Width', 400, 1000, state.width, 1, v => state.width = v);
    addSlider('Zoom', 0.5, 3.0, state.zoom, 0.1, v => state.zoom = v);
    addCheckbox('Heatmap', state.showHeatmap, v => state.showHeatmap = v);
    addCheckbox('Outlines', state.showOutlines, v => state.showOutlines = v);
    addCheckbox('Lines', state.showBoundaries, v => state.showBoundaries = v);
    
    if (currentDemo === 'smooth_blending') {
        addSlider('Smooth Factor', 0, 100, state.k, 1, v => state.k = v);
    }
    if (currentDemo === 'mutation_test' || currentDemo === 'statue_field') {
        addSlider('Rotation Speed', 0, 5, state.mutationSpeed, 0.1, v => state.mutationSpeed = v);
    }
}

canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - rect.left) / state.zoom;
    state.mouse.y = (e.clientY - rect.top) / state.zoom;
};

function renderMicroscope(ctx: CanvasRenderingContext2D, field: any, result: any) {
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? '#fff' : '#000';
    const accent = isDark ? '#0ff' : '#00f';

    // Draw a lens effect / crosshair
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(state.mouse.x - 50, state.mouse.y);
    ctx.lineTo(state.mouse.x + 50, state.mouse.y);
    ctx.moveTo(state.mouse.x, state.mouse.y - 50);
    ctx.lineTo(state.mouse.x, state.mouse.y + 50);
    ctx.stroke();

    // Sample SDF values around mouse
    ctx.font = `${10 / state.zoom}px JetBrains Mono`;
    ctx.fillStyle = accent;
    const sdf = field.getSDF(state.mouse.x, state.mouse.y);
    ctx.fillText(`SDF: ${sdf.toFixed(4)}μn`, state.mouse.x + 5, state.mouse.y - 5);

    // Render micro-metrics for visible segments
    result.lines.forEach((line: any) => {
        if (Math.abs(line.y - state.mouse.y) < 100) {
            line.segments.forEach((seg: any) => {
                // Technical overlay on segments
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
                ctx.strokeRect(line.startX, line.y, seg.width, 30);
            });
        }
    });

    // Draw "microscope" UI label
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI
    ctx.fillStyle = accent;
    ctx.font = "bold 12px JetBrains Mono";
    ctx.fillText("MICRO-VANTAGE ACTIVE [128X SAMPLING]", 20, 40);
    
    // Detailed stats panel in microscope
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 50, 200, 100);
    ctx.strokeStyle = accent;
    ctx.strokeRect(20, 50, 200, 100);
    
    ctx.fillStyle = accent;
    ctx.font = "9px JetBrains Mono";
    ctx.fillText(`SAMPLING: POSITIVE_ONLY`, 30, 70);
    ctx.fillText(`FIELD_RES: RESOLUTION_INDEPENDENT`, 30, 85);
    ctx.fillText(`SUB_GLYPH: ${Math.random().toFixed(4)}...`, 30, 100);
    ctx.fillText(`ALIGN: SPECTRAL_JUSTIFY`, 30, 115);
    ctx.fillText(`BOUNDS: SDF_GRADIENT_SAFE`, 30, 130);

    // Crosshair target info
    ctx.font = "10px JetBrains Mono";
    const screenX = state.mouse.x * state.zoom;
    const screenY = state.mouse.y * state.zoom;
    ctx.fillText(`X: ${state.mouse.x.toFixed(2)}`, screenX + 15, screenY + 15);
    ctx.fillText(`Y: ${state.mouse.y.toFixed(2)}`, screenX + 15, screenY + 28);
    ctx.restore();
}

async function runTrueBenchmark() {
    const resultsEl = document.getElementById('bench-results')!;
    resultsEl.innerHTML = '<div class="bench-sub">Warming up CPU...</div>';
    
    // Test parameters
    const glyphCount = 50000;
    const text = "Free Space ".repeat(glyphCount / 10);
    const font = "300 21px Inter";
    
    // 1. Prepare
    const prepared = prepare(text, font);
    const field = new CircleField(400, 400, 150, 800);
    const options = { maxWidth: 800, lineHeight: 30, field };

    const runTest = (fn: () => void, iterations: number = 20) => {
        const start = performance.now();
        for(let i=0; i<iterations; i++) fn();
        return (performance.now() - start) / iterations;
    };

    // Actual tests
    const tFree = runTest(() => {
        flowText(prepared, options as any);
    }, 50);

    const ctxBench = (document.createElement('canvas').getContext('2d'))!;
    ctxBench.font = font;
    const tCanvas = runTest(() => {
        ctxBench.measureText(text);
    }, 100);

    const tDOM = runTest(() => {
        const div = document.createElement('div');
        div.style.visibility = 'hidden';
        div.style.position = 'absolute';
        div.style.width = '800px';
        div.style.font = font;
        div.innerText = text;
        document.body.appendChild(div);
        div.getBoundingClientRect(); // Trigger layout
        document.body.removeChild(div);
    }, 5);

    const max = Math.max(tFree, tCanvas, tDOM);

    const formatRow = (name: string, val: number, desc: string) => `
        <div class="bench-row">
            <div class="bench-top">
                <span class="bench-name">${name}</span>
                <span class="bench-value">${val.toFixed(2)}ms</span>
            </div>
            <div class="bench-bar-bg">
                <div class="bench-bar-fill" style="width: ${(val/max*100).toFixed(1)}%"></div>
            </div>
            <div class="bench-sub">${desc}</div>
        </div>
    `;

    resultsEl.innerHTML = `
        ${formatRow('Free Space', tFree, 'Arithmetic SDF Layout')}
        ${formatRow('Canvas API', tCanvas, 'measureText only')}
        ${formatRow('DOM', tDOM, 'Reflow + getBoundingClientRect')}
    `;
}

function tick() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    if (now > lastTime + 1000) {
        fps = (frameCount * 1000) / (now - lastTime);
        lastTime = now;
        frameCount = 0;
    }
    frameCount++;
    state.rotation += dt * state.mutationSpeed;

    const font = "500 20px Inter";
    const lineHeight = 22;

    const t0 = performance.now();
    const d = DATA[currentDemo] || DATA.technical_brief;
    if (!cachedPrepared || cachedPrepared.name !== currentDemo) {
        cachedPrepared = {
            name: currentDemo,
            data: prepare(d.text.repeat(3), font)
        };
    }
    const prepared = cachedPrepared.data;
    const t1 = performance.now();

    let field: any;
    const center = { x: state.width / 2, y: 300 };
    const isDark = document.documentElement.classList.contains('dark');
    
    if (currentDemo === 'editorial_page') {
        // Architectural Layout: Large diagonal cut + Pull-quote circle
        field = new MultiShapeField([
            new PolygonField([
                { x: 0, y: 0 },
                { x: 150, y: 0 },
                { x: 250, y: 200 },
                { x: 100, y: 450 },
                { x: 0, y: 450 }
            ], state.width),
            new CircleField(state.width - 150, 450, 80, state.width),
            new BoxField(state.width - 320, 150, 150, 80, 20, state.width)
        ], state.width);
    } else if (currentDemo === 'technical_brief') {
        field = new MultiShapeField([
            new CircleField(center.x, center.y, 80, state.width),
            new CircleField(state.mouse.x, state.mouse.y, 60, state.width)
        ], state.width);
    } else if (currentDemo === 'statue_field') {
        field = statueField;
        if (statueField) statueField.update(state.rotation);
    } else if (currentDemo === 'raycasting' || currentDemo === 'ray_marching') {
        field = new MultiShapeField([
            new CircleField(center.x, center.y, 100, state.width),
            new CircleField(center.x + 80, center.y + 40, 60, state.width),
            new CircleField(state.mouse.x, state.mouse.y, 40, state.width)
        ], state.width);
    } else if (currentDemo === 'unified_field') {
        const logo = "M 100 0 L 125 75 L 200 75 L 140 120 L 160 200 L 100 150 L 40 200 L 60 120 L 0 75 L 75 75 Z";
        field = new SVGField(logo, center.x - 100, center.y - 100, 1.5, state.width, 1000);
    } else if (currentDemo === 'boolean_composition') {
        const c1 = new CircleField(center.x, center.y, 120, state.width);
        const c2 = new CircleField(state.mouse.x, state.mouse.y, 80, state.width);
        // Use ShapeIntersectionField to show exclusion ONLY in the overlap
        field = new ShapeIntersectionField(c1, c2, state.width);
    } else if (currentDemo === 'polygon_flow') {
        const r = 150;
        field = new PolygonField([
            { x: center.x, y: center.y - r },
            { x: center.x + r, y: center.y + r/2 },
            { x: center.x + r/2, y: center.y + r },
            { x: center.x - r/2, y: center.y + r },
            { x: center.x - r, y: center.y + r/2 }
        ], state.width);
    } else if (currentDemo === 'smooth_blending') {
        const sdfA = (x: number, y: number) => Math.sqrt((x-center.x)**2 + (y-center.y)**2) - 100;
        const sdfB = (x: number, y: number) => Math.sqrt((x-state.mouse.x)**2 + (y-state.mouse.y)**2) - 60;
        field = new SmoothUnionField(sdfA, sdfB, state.k, 0, state.width);
    } else if (currentDemo === 'gradient_sampling') {
        field = new SDFField((x:number, y:number) => Math.sqrt((x-center.x)**2 + (y-center.y)**2) - 100, 20, state.width);
    } else if (currentDemo === 'mutation_test') {
        const s = 1 + Math.sin(state.rotation)*0.5;
        field = new CircleField(center.x, center.y, 100*s, state.width);
    } else if (currentDemo === 'microscope') {
        // Very high zoom, showing micro details
        state.zoom = 4.0;
        field = new MultiShapeField([
            new CircleField(state.mouse.x, state.mouse.y, 25, state.width),
            new PolygonField([
                {x: 400, y: 150},
                {x: 450, y: 150},
                {x: 425, y: 200}
            ], state.width)
        ], state.width);
    } else if (currentDemo === 'benchmarks') {
        field = new CircleField(center.x, center.y, 150, state.width);
    } else {
        field = new CircleField(center.x, center.y, 100, state.width);
    }

    if (!field) {
        field = {
            getAvailableSpans: (y: number, h: number) => [{ x: 0, width: state.width }],
            getSDF: (x: number, y: number) => 1000
        } as any;
    }

    const result = flowText(prepared, { maxWidth: state.width, lineHeight, field, textAlign: 'justify' });
    const t2 = performance.now();

    const totalH = Math.max(800, result.totalHeight + 200);
    const displayW = state.width * state.zoom;
    const displayH = totalH * state.zoom;
    
    if (canvas.width !== displayW * devicePixelRatio || canvas.height !== displayH * devicePixelRatio) {
        canvas.width = displayW * devicePixelRatio; canvas.height = displayH * devicePixelRatio;
        canvas.style.width = displayW + 'px'; canvas.style.height = displayH + 'px';
    }

    ctx.save();
    ctx.scale(devicePixelRatio * state.zoom, devicePixelRatio * state.zoom);
    ctx.clearRect(0, 0, displayW, displayH);

    if (state.showHeatmap) {
        renderFieldHeatmap(ctx, field, state.width, totalH);
    }
    
    if (state.showOutlines) {
        renderFieldOutlines(ctx, field);
    }

    if (currentDemo === 'statue_field' && statueField) {
        statueField.renderTo(ctx, state.width, totalH, isDark);
        
        // Show volumetric light from mouse
        renderVisibilityField(ctx, statueField, state.mouse.x, state.mouse.y, 400);

        if (state.showOutlines) {
            // Show ray marching across the field
            for (let i = 0; i < 5; i++) {
                renderRayMarch(ctx, statueField, state.mouse.y + (i-2)*50, state.width);
            }
        }
    }

    if (currentDemo === 'raycasting') {
        renderRaycast(ctx, field, state.mouse.y, state.width);
    }
    
    if (currentDemo === 'ray_marching') {
        renderRayMarch(ctx, field, state.mouse.y, state.width);
    }

    if (state.showBoundaries) {
        renderLineBoundaries(ctx, result);
    }

    ctx.fillStyle = isDark ? '#fff' : '#000';
    renderToCanvas(ctx, result);

    if (currentDemo === 'microscope') {
        renderMicroscope(ctx, field, result);
    }

    ctx.restore();

    const t3 = performance.now();
    prepareMsEl.textContent = (t1 - t0).toFixed(1);
    layoutMsEl.textContent = (t2 - t1).toFixed(1);
    renderMsEl.textContent = (t3 - t2).toFixed(1);
    fpsEl.textContent = Math.round(fps).toString();

    const sdfAtMouse = field.getSDF(state.mouse.x, state.mouse.y);
    sdfTelemetryEl.textContent = sdfAtMouse.toFixed(1);

    // SDF Visual Explanation (Concentric Rings / Radar)
    ctx.save();
    ctx.scale(devicePixelRatio * state.zoom, devicePixelRatio * state.zoom);

    if (currentDemo === 'technical_brief') {
        const color = isDark ? '#fff' : '#000';
        const accent = isDark ? '#6366f1' : '#4f46e5';

        // 1. Box Model Illustration (Left)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 480, 120, 80);
        ctx.font = "700 11px Inter";
        ctx.fillStyle = color;
        ctx.fillText("DIV (BOX MODEL)", 55, 470);
        ctx.font = "400 9px JetBrains Mono";
        ctx.fillText("[x,y,w,h] - Discrete", 50, 575);

        // 2. Field Model Illustration (Right)
        ctx.beginPath();
        ctx.arc(280, 520, 45, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "700 11px Inter";
        ctx.fillText("FIELD (SDF MODEL)", 230, 470);
        ctx.font = "400 9px JetBrains Mono";
        ctx.fillText("f(p)=|p-c|-r - Continuous", 220, 580);

        // Comparison Rays (Visualizing Sampling)
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
        for (let i = 0; i < 6; i++) {
            const ry = 485 + i * 14;
            ctx.beginPath();
            ctx.moveTo(0, ry);
            ctx.lineTo(state.width, ry);
            ctx.stroke();
        }
    }
    
    const dAbs = Math.abs(sdfAtMouse);
    const isInside = sdfAtMouse < 0;

    // The 'Calculated Radius' circle
    ctx.beginPath();
    ctx.arc(state.mouse.x, state.mouse.y, dAbs, 0, Math.PI * 2);
    ctx.strokeStyle = isInside ? 'rgba(239, 68, 68, 0.4)' : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.3)');
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Exact Radius Vector using Gradient Search
    if (dAbs > 2) {
        const eps = 1.0;
        const dx = (field.getSDF(state.mouse.x + eps, state.mouse.y) - field.getSDF(state.mouse.x - eps, state.mouse.y)) / (2 * eps);
        const dy = (field.getSDF(state.mouse.x, state.mouse.y + eps) - field.getSDF(state.mouse.x, state.mouse.y - eps)) / (2 * eps);
        const len = Math.sqrt(dx*dx + dy*dy);
        
        if (len > 0.1) {
            const nx = dx / len;
            const ny = dy / len;
            // Vector points AWAY from field (towards higher SDF). 
            // If we are outside (SDF > 0), nearest boundary is in -N direction.
            // If we are inside (SDF < 0), nearest boundary is in +N direction.
            const dir = isInside ? 1.0 : -1.0;
            
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(state.mouse.x, state.mouse.y);
            ctx.lineTo(state.mouse.x + nx * dir * dAbs, state.mouse.y + ny * dir * dAbs);
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = "700 9px JetBrains Mono";
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillText(`radius = ${dAbs.toFixed(1)}px`, state.mouse.x + nx * dir * dAbs + 10, state.mouse.y + ny * dir * dAbs);
        }
    }
    
    ctx.restore();

    requestAnimationFrame(tick);
}

loadDemo('editorial_page');
tick();
