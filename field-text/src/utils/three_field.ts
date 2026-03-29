import * as THREE from 'three';
import { ShapeField } from '../types';

/**
 * StatueField uses Three.js to render a 3D model to a 2D silhouette,
 * then samples that silhouette to determine available layout spans.
 */
export class StatueField implements ShapeField {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private mesh: THREE.Group | THREE.Mesh | null = null;
    private target: THREE.WebGLRenderTarget;
    private pixels: Uint8Array;

    constructor(
        public maxWidth: number,
        public height: number
    ) {
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(256, 256); // Low res for fast sampling
        this.target = new THREE.WebGLRenderTarget(256, 256);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        this.camera.position.z = 5;
        this.pixels = new Uint8Array(256 * 256 * 4);
        
        // Add basic lighting for display
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const direct = new THREE.DirectionalLight(0xffffff, 1.5);
        direct.position.set(5, 5, 5);
        this.scene.add(direct);
    }

    setSize(w: number, h: number) {
        this.maxWidth = w;
        this.height = h;
    }

    setModel(model: THREE.Group | THREE.Mesh) {
        if (this.mesh) this.scene.remove(this.mesh);
        this.mesh = model;
        this.scene.add(this.mesh);
    }

    update(rotation: number) {
        if (this.mesh) {
            this.mesh.rotation.y = rotation;
        }
        // Render silhouette (alpha only)
        this.renderer.setRenderTarget(this.target);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.readRenderTargetPixels(this.target, 0, 0, 256, 256, this.pixels);
        this.renderer.setRenderTarget(null);
    }

    renderTo(ctx: CanvasRenderingContext2D, width: number, height: number, isDark: boolean) {
        if (!this.mesh) return;
        this.renderer.setRenderTarget(null);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setClearColor(0x000000, 0);
        
        this.renderer.render(this.scene, this.camera);
        
        // Draw to main canvas
        ctx.save();
        ctx.globalAlpha = isDark ? 0.3 : 0.15;
        ctx.drawImage(this.renderer.domElement, 0, 0, width, height);
        ctx.restore();
    }

    getSDF(x: number, y: number): number {
        const res = 256;
        const scaleX = this.maxWidth / res;
        const scaleY = this.height / res;
        const tx = Math.floor(x / scaleX);
        const ty = Math.floor((this.height - y) / scaleY);
        if (tx < 0 || tx >= res || ty < 0 || ty >= res) return 20;
        const idx = (ty * res + tx) * 4 + 3;
        const alpha = this.pixels[idx];
        return alpha > 128 ? -20 : 20;
    }

    getAvailableSpans(y: number, lineHeight: number): { x: number; width: number }[] {
        const spans: { x: number; width: number }[] = [];
        const res = 256;
        const scaleX = this.maxWidth / res;
        const scaleY = this.height / res;

        // Map y to target coord (y is inverted in GL)
        const ty = Math.floor((this.height - y) / scaleY);

        let currentSpan: { x: number; width: number } | null = null;
        const step = 4;

        for (let x = 0; x < this.maxWidth; x += step) {
            const tx = Math.floor(x / scaleX);
            const idx = (Math.max(0, Math.min(res - 1, ty)) * res + tx) * 4 + 3;
            const alpha = this.pixels[idx];
            const isInside = alpha > 128; // Silhouette threshold

            if (!isInside) {
                if (!currentSpan) {
                    currentSpan = { x, width: 0 };
                    spans.push(currentSpan);
                }
                currentSpan.width += step;
            } else {
                currentSpan = null;
            }
        }

        return spans;
    }
}
