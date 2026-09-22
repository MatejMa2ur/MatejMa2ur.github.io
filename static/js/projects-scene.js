// Ambient backdrop for the Projects page.
//
// A single pinned canvas sits behind the project bands. Scrolling drifts a field
// of flat shapes and, at the seam between one project and the next, re-forms the
// COD3RS chevron mark into the Y-A-S diagonals. It is decorative only: the page
// says everything it needs to say in plain HTML, so it reads identically with
// JavaScript off, with WebGL unavailable, or with prefers-reduced-motion set.
// three.js loads only once the stage is near the viewport, so no other page pays
// for it.

// The minified build; it pulls a sibling ./three.core.min.js from the same
// directory, which is why the version is pinned rather than floating.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

// Mirrors the :root custom properties in static/style/style.css.
const COLORS = {
    light100: 0xCEE5F2,
    light200: 0xACCBE1,
    light300: 0x7C98B3,
    yellow: 0xF4C244,
};

// How visible the watermark is while you are reading a project, and at the seam
// between two of them. The gap between the two is the whole effect; both numbers
// stay low enough that the copy never has to compete with it.
const RESTING_OPACITY = 0.18;
const SEAM_OPACITY = 0.55;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const lerp = (from, to, amount) => from + (to - from) * amount;

// Eased 0 -> 1 ramp, used to fade each mark in and out.
const ramp = (edge0, edge1, value) => {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
};

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const supportsWebGL = () => {
    try {
        const probe = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
            (probe.getContext('webgl2') || probe.getContext('webgl')));
    } catch (error) {
        return false;
    }
};

// One closed outline. Coordinates come straight from the SVG marks used on the
// page, mapped from the SVG's y-down space into the scene's y-up space. The marks
// are traced rather than filled: overlapping translucent fills turn to mud during
// the hand-over, where overlapping lines still read as one drawing changing shape.
const outlineShape = (THREE, points, color) => {
    const vertices = points.map(([x, y]) => new THREE.Vector3((x - 240) / 100, (180 - y) / 100, 0));
    vertices.push(vertices[0].clone());

    return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(vertices),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }),
    );
};

// The COD3RS mark: an angle-bracket pair around a slash.
const createChevronMark = (THREE) => {
    const group = new THREE.Group();
    group.add(outlineShape(THREE, [
        [150, 60], [40, 180], [150, 300], [186, 264], [112, 180], [186, 96],
    ], COLORS.light200));
    group.add(outlineShape(THREE, [
        [330, 60], [440, 180], [330, 300], [294, 264], [368, 180], [294, 96],
    ], COLORS.light300));
    group.add(outlineShape(THREE, [
        [292, 66], [250, 66], [188, 294], [230, 294],
    ], COLORS.yellow));
    group.add(outlineShape(THREE, [
        [206, 316], [240, 316], [240, 350], [206, 350],
    ], COLORS.light100));
    return group;
};

// The Y-A-S mark: the stack of diagonal bars the page already uses as decoration,
// traced in the same weight as the chevrons so one can become the other.
const createDiagonalMark = (THREE) => {
    const group = new THREE.Group();
    const bars = [
        { offset: 0.0, length: 2.6, color: COLORS.light300 },
        { offset: 0.62, length: 2.1, color: COLORS.light200 },
        { offset: -0.62, length: 3.0, color: COLORS.yellow },
        { offset: 1.2, length: 0.8, color: COLORS.light100 },
    ];
    const width = 0.42;

    bars.forEach(({ offset, length, color }) => {
        const half = length / 2;
        const points = [
            [-half, width / 2], [half, width / 2], [half, -width / 2], [-half, -width / 2],
        ].map(([x, y]) => new THREE.Vector3(x, y, 0));
        points.push(points[0].clone());

        const bar = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }),
        );
        bar.position.set(offset * 0.5, offset, 0);
        bar.rotation.z = Math.PI / 4;
        group.add(bar);
    });
    return group;
};

const buildScene = (THREE, canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearAlpha(0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    camera.position.set(0, 0, 6.2);

    const chevrons = createChevronMark(THREE);
    const diagonals = createDiagonalMark(THREE);

    const world = new THREE.Group();
    world.add(chevrons, diagonals);
    scene.add(world);

    return { renderer, scene, camera, world, parts: { chevrons, diagonals } };
};

// Fade a whole group by walking its materials. Every material in the scene is
// created transparent, and each remembers the opacity it was built with.
const setGroupOpacity = (group, opacity) => {
    group.visible = opacity > 0.01;
    group.traverse((child) => {
        if (child.material && child.material.transparent) {
            child.material.opacity = opacity * (child.material.userData.baseOpacity ?? 1);
        }
    });
};

const rememberBaseOpacity = (group) => {
    group.traverse((child) => {
        if (child.material && child.material.transparent) {
            child.material.userData.baseOpacity = child.material.opacity;
        }
    });
};

const initProjectsScene = () => {
    const canvas = document.getElementById('projects-scene');
    const track = document.getElementById('scene-track');
    const stage = document.getElementById('scene-stage');
    if (!canvas || !track || !stage) {
        return;
    }
    if (prefersReducedMotion() || !supportsWebGL()) {
        return;
    }

    const clockStart = performance.now();
    let context = null;
    let frame = null;
    let onScreen = false;
    let loading = false;

    const progress = () => {
        const rect = track.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        return travel > 0 ? clamp01(-rect.top / travel) : 0;
    };

    const resize = () => {
        if (!context) {
            return;
        }
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height) {
            return;
        }
        context.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        context.renderer.setSize(width, height, false);
        context.camera.aspect = width / height;
        context.camera.updateProjectionMatrix();
    };

    const update = () => {
        const p = progress();
        const time = (performance.now() - clockStart) / 1000;
        const { chevrons, diagonals } = context.parts;

        // The watermark recedes while a project is being read and swells in the gap
        // between them, which is where the two marks trade places.
        const seam = ramp(0.18, 0.46, p) * (1 - ramp(0.54, 0.86, p));
        const presence = lerp(RESTING_OPACITY, SEAM_OPACITY, seam);
        const morph = ramp(0.4, 0.6, p);

        // One gesture, shared by both marks: a slow quarter-turn and a drift down
        // the page, with the form changing hands in the middle of it.
        const turn = lerp(-0.18, 0.18, morph);
        const drop = lerp(1.1, -1.1, p);

        setGroupOpacity(chevrons, presence * (1 - morph));
        chevrons.position.set(0, drop, 0);
        chevrons.rotation.z = turn + Math.sin(time * 0.16) * 0.015;
        chevrons.scale.setScalar(lerp(0.82, 0.62, morph));

        setGroupOpacity(diagonals, presence * morph);
        diagonals.position.set(0, drop, 0);
        diagonals.rotation.z = turn + Math.sin(time * 0.13) * 0.015;
        diagonals.scale.setScalar(lerp(0.62, 0.82, morph));

        context.camera.position.y = lerp(0.35, -0.35, p);
        context.camera.lookAt(0, context.camera.position.y, 0);

        // A watermark is allowed to bleed off the edges, so this only pulls the
        // mark in on genuinely narrow and portrait viewports.
        const halfFov = (context.camera.fov * Math.PI) / 360;
        const visibleWidth =
            2 * Math.tan(halfFov) * context.camera.position.z * context.camera.aspect;
        context.world.scale.setScalar(Math.min(1, Math.max(0.6, visibleWidth / 5.2)));

        context.renderer.render(context.scene, context.camera);
    };

    const tick = () => {
        update();
        frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
        if (frame === null && context && onScreen && !document.hidden) {
            frame = window.requestAnimationFrame(tick);
        }
    };

    const stop = () => {
        if (frame !== null) {
            window.cancelAnimationFrame(frame);
            frame = null;
        }
    };

    const load = async () => {
        const THREE = await import(THREE_URL);
        context = buildScene(THREE, canvas);
        Object.values(context.parts).forEach(rememberBaseOpacity);
        resize();
        new ResizeObserver(resize).observe(stage);
        stage.classList.add('scene-stage--live');
        start();
    };

    const observer = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (!context && !loading && onScreen) {
            // First approach: fetch three.js. Afterwards the same observer only
            // starts and stops the render loop.
            loading = true;
            load().catch(() => {
                // three.js could not be fetched — the static fallback stays visible.
                stage.classList.remove('scene-stage--live');
            });
            return;
        }
        if (onScreen) {
            start();
        } else {
            stop();
        }
    }, { rootMargin: '200px' });

    observer.observe(stage);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectsScene);
} else {
    initProjectsScene();
}
