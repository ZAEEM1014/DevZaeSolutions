/* ==========================================================================
   DevZaeSolution — Global 3D scene (Three.js r128)
   A single WebGL canvas, fixed behind the entire site, that renders a
   cinematic "software studio" space: a network mesh, floating glass app
   panels, and clean device motifs (laptop / phone / database / cloud)
   connected by soft glowing links. Scroll reads as camera travel through
   the scene; the hero can additionally "drive" the camera via
   window.DZScene.setHeroProgress(0..1) for a pinned cinematic intro.

   Built for stability first: capped pixel ratio, low poly counts on
   small screens, clamped/lerped camera (no snapping or jitter), no
   external post-processing dependency (glow is faked with additive
   sprites, so there is nothing extra to fail to load), and full
   prefers-reduced-motion support.
   ========================================================================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!window.THREE || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------
  // Core setup
  // ---------------------------------------------------------------------
  const scene = new THREE.Scene();
  let W = window.innerWidth;
  let H = window.innerHeight;

  const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 120);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(W, H);
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  if ('toneMapping' in renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }

  // Soft depth cue so distant geometry fades instead of hard-clipping —
  // reads as atmosphere / depth-of-field without an expensive shader pass.
  scene.fog = new THREE.FogExp2(0x0b1120, 0.028);

  const isSmall = window.innerWidth < 700;
  const isTiny = window.innerWidth < 420;

  // ---------------------------------------------------------------------
  // Lights — key / fill / rim, tuned so nothing blows out or looks flat
  // ---------------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0x8899aa, 0.55));
  const key = new THREE.DirectionalLight(0x4ce0d2, 1.0);
  key.position.set(6, 7, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6f8cff, 0.35);
  fill.position.set(-8, 2, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff8552, 0.55);
  rim.position.set(-5, -4, -6);
  scene.add(rim);

  // ---------------------------------------------------------------------
  // Reusable soft-glow sprite texture (fakes bloom cheaply + reliably)
  // ---------------------------------------------------------------------
  function makeGlowTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  const glowTex = makeGlowTexture();

  function addGlow(parent, color, scale, opacity) {
    const mat = new THREE.SpriteMaterial({
      map: glowTex, color, transparent: true, opacity: opacity != null ? opacity : 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    parent.add(sprite);
    return sprite;
  }

  // ---------------------------------------------------------------------
  // Layer A — network mesh: nodes + links (distributed systems / API calls)
  // ---------------------------------------------------------------------
  const meshGroup = new THREE.Group();
  const nodeCount = isTiny ? 22 : isSmall ? 34 : 56;
  const spread = 13;
  const nodes = [];

  const nodeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const nodeMatTeal = new THREE.MeshBasicMaterial({ color: 0x4ce0d2, transparent: true, opacity: 0.9 });
  const nodeMatAmber = new THREE.MeshBasicMaterial({ color: 0xff8552, transparent: true, opacity: 0.9 });

  for (let i = 0; i < nodeCount; i++) {
    const mat = i % 5 === 0 ? nodeMatAmber : nodeMatTeal;
    const node = new THREE.Mesh(nodeGeo, mat);
    node.position.set(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 1.4,
      (Math.random() - 0.5) * 10 - 3
    );
    node.userData = { base: node.position.clone(), offset: Math.random() * Math.PI * 2 };
    nodes.push(node);
    meshGroup.add(node);
  }

  const lineMat = new THREE.LineBasicMaterial({ color: 0x4ce0d2, transparent: true, opacity: 0.14 });
  const linkThreshold = 4.4;
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = nodeCount * 6;
  const linePosArray = new Float32Array(maxLines * 2 * 3);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePosArray, 3));
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  meshGroup.add(lineSegments);
  scene.add(meshGroup);

  function updateLinks() {
    let idx = 0;
    for (let i = 0; i < nodes.length && idx < maxLines; i++) {
      for (let j = i + 1; j < nodes.length && idx < maxLines; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < linkThreshold) {
          const a = nodes[i].position, b = nodes[j].position;
          const o = idx * 6;
          linePosArray[o] = a.x; linePosArray[o + 1] = a.y; linePosArray[o + 2] = a.z;
          linePosArray[o + 3] = b.x; linePosArray[o + 4] = b.y; linePosArray[o + 5] = b.z;
          idx++;
        }
      }
    }
    lineGeo.setDrawRange(0, idx * 2);
    lineGeo.attributes.position.needsUpdate = true;
  }

  // ---------------------------------------------------------------------
  // Layer B — floating glass "app / browser window" panels (brand motif)
  // ---------------------------------------------------------------------
  function roundedPanel(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x, y + r);
    shape.lineTo(x, y + h - r);
    shape.quadraticCurveTo(x, y + h, x + r, y + h);
    shape.lineTo(x + w - r, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    shape.lineTo(x + w, y + r);
    shape.quadraticCurveTo(x + w, y, x + w - r, y);
    shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y + r);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 8,
    });
  }

  const palette = [0x4ce0d2, 0xff8552, 0xedeff4];
  const panelGroup = new THREE.Group();
  const panels = [];
  const panelCount = isTiny ? 5 : isSmall ? 7 : 10;

  for (let i = 0; i < panelCount; i++) {
    const w = 1.1 + Math.random() * 1.0;
    const h = w * (1.5 + Math.random() * 0.5);
    const geo = roundedPanel(w, h, 0.16);
    const color = palette[i % palette.length];

    const mat = new THREE.MeshPhysicalMaterial({
      color, transparent: true, opacity: 0.14 + Math.random() * 0.1,
      roughness: 0.25, metalness: 0.1, transmission: 0.4, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
    mesh.add(new THREE.LineSegments(edges, edgeMat));

    const radius = 5 + Math.random() * 7;
    const angle = (i / panelCount) * Math.PI * 2;
    mesh.position.set(
      Math.cos(angle) * radius * (0.6 + Math.random() * 0.6) + (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 8 - 4
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData = {
      speed: 0.05 + Math.random() * 0.1,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.3 + Math.random() * 0.4,
      baseY: mesh.position.y,
    };
    panels.push(mesh);
    panelGroup.add(mesh);
  }
  scene.add(panelGroup);

  // ---------------------------------------------------------------------
  // Layer C — device motifs: laptop, phone, database, cloud. These sell
  // the "web & mobile app studio" theme with real geometry, not sprites.
  // ---------------------------------------------------------------------
  const deviceGroup = new THREE.Group();
  const floaters = []; // shared gentle-float animation list

  function screenGlowMaterial(color) {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
  }

  // --- Laptop: base + hinged screen with a glowing "code editor" panel ---
  function buildLaptop() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x16223a, roughness: 0.35, metalness: 0.6, clearcoat: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.09, 1.4), bodyMat);
    g.add(base);

    const lid = new THREE.Group();
    const lidBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 0.06), bodyMat);
    lidBack.position.set(0, 0.65, -0.67);
    lid.add(lidBack);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 1.1), screenGlowMaterial(0x4ce0d2));
    screen.material.opacity = 0.5;
    screen.position.set(0, 0.65, -0.635);
    lid.add(screen);

    // "code lines" on the screen — thin bright bars, staggered widths
    for (let i = 0; i < 5; i++) {
      const w = 0.55 + Math.random() * 1.1;
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.045), screenGlowMaterial(i % 2 ? 0xff8552 : 0xedeff4));
      bar.material.opacity = 0.75;
      bar.position.set(-0.98 + w / 2, 1.02 - i * 0.16, -0.63);
      lid.add(bar);
    }
    lid.rotation.x = -0.15;
    g.add(lid);
    g.add(addGlow(g, 0x4ce0d2, 3.2, 0.35));
    return g;
  }

  // --- Phone: rounded body + glowing app screen ---
  function buildPhone() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x101a2e, roughness: 0.3, metalness: 0.5, clearcoat: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.28, 0.07), bodyMat);
    body.geometry = roundedBoxGeo(0.62, 1.28, 0.07, 0.08);
    g.add(body);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.12), screenGlowMaterial(0xff8552));
    screen.material.opacity = 0.55;
    screen.position.z = 0.037;
    g.add(screen);

    for (let i = 0; i < 3; i++) {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), screenGlowMaterial(0xedeff4));
      card.material.opacity = 0.6;
      card.position.set(0, 0.34 - i * 0.24, 0.038);
      g.add(card);
    }
    g.add(addGlow(g, 0xff8552, 2.1, 0.32));
    return g;
  }

  // Cheap "rounded box" via BoxGeometry + bevel look (kept simple/cheap —
  // a real rounded-rect extrusion is overkill at this screen size).
  function roundedBoxGeo(w, h, d, r) {
    return new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  }

  // --- Database: stacked flattened cylinders ---
  function buildDatabase() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x4ce0d2, transparent: true, opacity: 0.22, roughness: 0.2, metalness: 0.2, transmission: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 24, 1, true), mat);
      cyl.position.y = i * 0.28;
      const rim2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.015, 8, 24), new THREE.MeshBasicMaterial({ color: 0x4ce0d2, transparent: true, opacity: 0.6 }));
      rim2.rotation.x = Math.PI / 2;
      rim2.position.y = i * 0.28 + 0.11;
      g.add(cyl, rim2);
    }
    g.add(addGlow(g, 0x4ce0d2, 2.6, 0.3));
    return g;
  }

  // --- Cloud: low-poly overlapping spheres, soft & pale ---
  function buildCloud() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xedeff4, transparent: true, opacity: 0.16, roughness: 0.6, metalness: 0, transmission: 0.3 });
    const puffs = [
      [0, 0, 0, 0.42], [0.36, 0.08, 0, 0.32], [-0.36, 0.06, 0, 0.3], [0.1, 0.22, 0.05, 0.28],
    ];
    puffs.forEach((p) => {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(p[3], 1), mat);
      s.position.set(p[0], p[1], p[2]);
      g.add(s);
    });
    g.add(addGlow(g, 0xedeff4, 2.2, 0.18));
    return g;
  }

  const devicePositions = isSmall
    ? [
        { build: buildLaptop, pos: [-3.4, 1.6, -2], rot: [0, 0.4, 0], scale: 0.85 },
        { build: buildPhone, pos: [3.2, -1.2, -1], rot: [0, -0.3, 0.05], scale: 0.85 },
      ]
    : [
        { build: buildLaptop, pos: [-4.6, 1.8, -3], rot: [0, 0.45, 0], scale: 1 },
        { build: buildPhone, pos: [4.4, -1.6, -1.5], rot: [0, -0.35, 0.06], scale: 1 },
        { build: buildDatabase, pos: [3.6, 2.6, -5], rot: [0, 0, 0], scale: 0.9 },
        { build: buildCloud, pos: [-3.8, -2.4, -4], rot: [0, 0, 0], scale: 1.3 },
      ];

  devicePositions.forEach((d) => {
    const obj = d.build();
    obj.position.set(d.pos[0], d.pos[1], d.pos[2]);
    obj.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
    obj.scale.setScalar(d.scale);
    obj.userData = { baseY: d.pos[1], floatOffset: Math.random() * Math.PI * 2, floatSpeed: 0.25 + Math.random() * 0.2 };
    floaters.push(obj);
    deviceGroup.add(obj);
  });
  scene.add(deviceGroup);

  // --- API connection lines between devices: soft glowing curves with a
  //     traveling pulse sprite to suggest live data flow ---
  const pulses = [];
  if (devicePositions.length > 1) {
    const linkMat = new THREE.LineBasicMaterial({ color: 0x4ce0d2, transparent: true, opacity: 0.22 });
    for (let i = 0; i < devicePositions.length; i++) {
      const a = new THREE.Vector3(...devicePositions[i].pos);
      const b = new THREE.Vector3(...devicePositions[(i + 1) % devicePositions.length].pos);
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.2, 1.5));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, linkMat);
      deviceGroup.add(line);

      const pulse = addGlow(deviceGroup, 0x4ce0d2, 0.4, 0.8);
      pulse.userData = { curve, t: Math.random(), speed: 0.08 + Math.random() * 0.05 };
      pulses.push(pulse);
    }
  }

  // ---------------------------------------------------------------------
  // Interaction: mouse parallax + scroll-driven camera travel, all lerped
  // so nothing snaps or jitters.
  // ---------------------------------------------------------------------
  let mouseX = 0, mouseY = 0;
  let scrollFrac = 0;
  let heroProgress = null; // set by hero cinematic script while hero is pinned; null = inactive
  let lastHeroProgress = 0; // last known hero progress, kept around while fading out
  let heroBlend = 0; // 0 = normal scroll parallax, 1 = hero cinematic — eased, never snapped

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function computeScrollFrac() {
    const max = document.body.scrollHeight - window.innerHeight;
    scrollFrac = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }
  window.addEventListener('scroll', computeScrollFrac, { passive: true });
  computeScrollFrac();

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    computeScrollFrac();
  }
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let linkTimer = 0;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05); // clamp so a tab-switch stutter can't fling the camera

    nodes.forEach((n) => {
      n.position.x = n.userData.base.x + Math.sin(t * 0.2 + n.userData.offset) * 0.6;
      n.position.y = n.userData.base.y + Math.cos(t * 0.18 + n.userData.offset) * 0.6;
    });
    linkTimer += dt;
    if (linkTimer > 0.12) { updateLinks(); linkTimer = 0; }

    panels.forEach((p) => {
      p.rotation.x += p.userData.speed * 0.006;
      p.rotation.y += p.userData.speed * 0.008;
      p.position.y = p.userData.baseY + Math.sin(t * p.userData.floatSpeed + p.userData.floatOffset) * 0.4;
    });

    floaters.forEach((f) => {
      f.position.y = f.userData.baseY + Math.sin(t * f.userData.floatSpeed + f.userData.floatOffset) * 0.28;
      f.rotation.y += 0.0016;
    });

    pulses.forEach((p) => {
      p.userData.t += dt * p.userData.speed;
      if (p.userData.t > 1) p.userData.t = 0;
      p.position.copy(p.userData.curve.getPoint(p.userData.t));
    });

    meshGroup.rotation.y = t * 0.015;
    panelGroup.rotation.y = t * 0.02;
    deviceGroup.rotation.y = Math.sin(t * 0.05) * 0.05;

    if (!reduceMotion) {
      // Cinematic hero drive — camera pushes deep into the scene, subtle
      // continuous rotation, clamped to a gentle range (no whip / spin).
      const heroTargetZ = 15 - lastHeroProgress * 6.5;
      const heroTargetRotX = lastHeroProgress * 0.16;
      const heroTargetRotY = lastHeroProgress * 0.32;

      // Ambient scroll parallax used everywhere outside the pinned hero.
      const normalTargetZ = 14 - scrollFrac * 5;
      const normalTargetRotX = scrollFrac * 0.35;
      const normalTargetRotY = scrollFrac * 0.6;

      // Cross-fade between the two target systems instead of switching
      // instantly. The two formulas don't naturally line up at the pin's
      // start/end scroll position, so a hard swap used to produce a visible
      // pop/glitch whenever the hero was scrolled back into or out of.
      // Easing heroBlend toward 0 or 1 (rather than snapping) makes both
      // directions of that transition read as one continuous motion.
      const blendTarget = heroProgress !== null ? 1 : 0;
      heroBlend += (blendTarget - heroBlend) * 0.08;

      const targetZ = normalTargetZ + (heroTargetZ - normalTargetZ) * heroBlend;
      const targetRotX = normalTargetRotX + (heroTargetRotX - normalTargetRotX) * heroBlend;
      const targetRotY = normalTargetRotY + (heroTargetRotY - normalTargetRotY) * heroBlend;

      // Tighter follow speed while inside (or still fading out of) the hero
      // cinematic so the background settles in step with the content fade
      // instead of trailing behind it after the pin has already released.
      const camLerp = heroBlend > 0.02 ? 0.07 : 0.04;
      camera.position.z += (targetZ - camera.position.z) * camLerp;
      camera.position.x += (mouseX * 1.3 - camera.position.x) * 0.035;
      camera.position.y += (-mouseY * 1.1 - camera.position.y * 0.15) * 0.035;

      scene.rotation.x += (targetRotX - scene.rotation.x) * camLerp;
      scene.rotation.y += (targetRotY - scene.rotation.y) * camLerp;

      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  animate();
  requestAnimationFrame(() => canvas.classList.add('ready'));

  // Public hook: hero cinematic scroll-scrub can call this with 0..1, or
  // null to release control back to normal page-scroll parallax.
  window.DZScene = {
    setHeroProgress(p) {
      heroProgress = p;
      if (p !== null) lastHeroProgress = p;
    },
  };
})();
