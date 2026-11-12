import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { IPAnalysisResult } from '../../types';
import { analyzeIP } from '../../services/ipCalculator';

interface NetworkSceneProps {
  currentIp: string;
  activeMode: 'octets' | 'topology' | 'packets';
  explodedOffset?: number; // 0 to 1
  selectedOctetIndex?: number | null;
  onSelectOctet?: (index: number) => void;
  celebrateTrigger?: number; // increments on correct answer
}

// Pre-allocated math objects to avoid garbage collection
const _vec3 = new THREE.Vector3();
const _colorNet = new THREE.Color(0x06b6d4); // Cyan for NetID
const _colorHost = new THREE.Color(0x10b981); // Emerald for HostID
const _colorBorder = new THREE.Color(0x1e293b);

export const NetworkScene: React.FC<NetworkSceneProps> = ({
  currentIp,
  activeMode,
  explodedOffset = 0,
  selectedOctetIndex = null,
  onSelectOctet,
  celebrateTrigger = 0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Groups
  const octetGroupRef = useRef<THREE.Group | null>(null);
  const topologyGroupRef = useRef<THREE.Group | null>(null);
  const packetsGroupRef = useRef<THREE.Group | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);

  // References for dynamic animated objects
  const octetCubesRef = useRef<THREE.Group[]>([]);
  const packetMeshesRef = useRef<{ mesh: THREE.Mesh; progress: number; speed: number; curve: THREE.CatmullRomCurve3 }[]>([]);

  // State / refs for smooth damping
  const explodedRef = useRef(explodedOffset);
  explodedRef.current = explodedOffset;

  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;

  const currentIpRef = useRef(currentIp);
  currentIpRef.current = currentIp;

  const selectedIndexRef = useRef(selectedOctetIndex);
  selectedIndexRef.current = selectedOctetIndex;

  const [hoveredOctet, setHoveredOctet] = useState<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 9);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = 3;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // 4. Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x06b6d4, 1.2, 20);
    fillLight.position.set(-6, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 0.8);
    rimLight.position.set(0, -3, -6);
    scene.add(rimLight);

    // Ground Grid & Contact Shadow
    const gridHelper = new THREE.GridHelper(24, 24, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -1.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // Radial shadow ground plane
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.51;
    scene.add(shadowPlane);

    // ==========================================
    // MODE 1: 3D IP OCTET ANALYZER
    // ==========================================
    const octetGroup = new THREE.Group();
    octetGroupRef.current = octetGroup;
    scene.add(octetGroup);

    octetCubesRef.current = [];
    const octetWidth = 1.35;
    const spacing = 1.65;

    for (let i = 0; i < 4; i++) {
      const singleOctetGroup = new THREE.Group();
      singleOctetGroup.name = `octet_${i}`;

      // Outer glass cyber shell
      const boxGeo = new THREE.BoxGeometry(octetWidth, 1.4, 1.1);
      const boxMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.castShadow = !isSoftwareGl;
      boxMesh.receiveShadow = !isSoftwareGl;
      singleOctetGroup.add(boxMesh);

      // Inner glowing core
      const coreGeo = new THREE.BoxGeometry(octetWidth * 0.75, 0.9, 0.75);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.name = 'core';
      singleOctetGroup.add(coreMesh);

      // 8 Micro-LED bits indicator
      const bitsGroup = new THREE.Group();
      bitsGroup.name = 'bits';
      for (let b = 0; b < 8; b++) {
        const bitGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
        const bitMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.8,
        });
        const bitMesh = new THREE.Mesh(bitGeo, bitMat);
        bitMesh.position.set(-0.42 + b * 0.12, 0.75, 0.35);
        bitMesh.rotation.x = Math.PI / 2;
        bitsGroup.add(bitMesh);
      }
      singleOctetGroup.add(bitsGroup);

      // Edge wireframe accent
      const edges = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
      const wire = new THREE.LineSegments(edges, lineMat);
      singleOctetGroup.add(wire);

      // Base pedestal connector
      const pedGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.3, 16);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = -0.85;
      singleOctetGroup.add(ped);

      singleOctetGroup.position.x = (i - 1.5) * spacing;
      octetGroup.add(singleOctetGroup);
      octetCubesRef.current.push(singleOctetGroup);
    }

    // Connecting laser bus between octets
    const busGeo = new THREE.CylinderGeometry(0.04, 0.04, 6.2, 12);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    bus.rotation.z = Math.PI / 2;
    bus.position.y = -0.95;
    octetGroup.add(bus);

    // ==========================================
    // MODE 2: 3D NETWORK TOPOLOGY
    // ==========================================
    const topologyGroup = new THREE.Group();
    topologyGroupRef.current = topologyGroup;
    topologyGroup.visible = false;
    scene.add(topologyGroup);

    // Central Enterprise Core Router
    const routerGroup = new THREE.Group();
    const rBodyGeo = new THREE.BoxGeometry(2.2, 0.6, 1.8);
    const rBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const rBody = new THREE.Mesh(rBodyGeo, rBodyMat);
    rBody.castShadow = !isSoftwareGl;
    routerGroup.add(rBody);

    // Router glowing faceplate
    const faceGeo = new THREE.PlaneGeometry(2.0, 0.4);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 0, 0.91);
    routerGroup.add(face);

    // Antennas
    for (let ant = -1; ant <= 1; ant += 2) {
      const antGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.0, 8);
      const antMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const antenna = new THREE.Mesh(antGeo, antMat);
      antenna.position.set(ant * 0.9, 0.7, -0.7);
      antenna.rotation.z = ant * -0.15;
      routerGroup.add(antenna);
    }
    routerGroup.position.set(0, 0.2, 0);
    topologyGroup.add(routerGroup);

    // Class A Cloud/Globe (Massive Network)
    const classAGroup = new THREE.Group();
    const globeGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: true,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    classAGroup.add(globe);
    // Orbiting mini-node ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.03, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    classAGroup.add(ring);
    classAGroup.position.set(-4.5, 1.2, -1);
    topologyGroup.add(classAGroup);

    // Class B Campus / Servers Group
    const classBGroup = new THREE.Group();
    for (let s = 0; s < 3; s++) {
      const rackGeo = new THREE.BoxGeometry(0.5, 1.8, 0.8);
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set((s - 1) * 0.7, 0.6, 0);
      classBGroup.add(rack);
    }
    classBGroup.position.set(4.5, 0.5, -1);
    topologyGroup.add(classBGroup);

    // Class C Small Office / Home LAN
    const classCGroup = new THREE.Group();
    for (let h = 0; h < 4; h++) {
      const pcGeo = new THREE.BoxGeometry(0.6, 0.5, 0.4);
      const pcMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
      const pc = new THREE.Mesh(pcGeo, pcMat);
      const angle = (h / 4) * Math.PI * 2;
      pc.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      classCGroup.add(pc);
    }
    classCGroup.position.set(0, -0.6, 3.2);
    topologyGroup.add(classCGroup);

    // Connecting holographic laser paths
    const makeCurveLine = (start: THREE.Vector3, end: THREE.Vector3, colorHex: number) => {
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 0.8, 0));
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const points = curve.getPoints(30);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
      const line = new THREE.Line(geo, mat);
      topologyGroup.add(line);
      return curve;
    };

    const curveA = makeCurveLine(routerGroup.position, classAGroup.position, 0x0284c7);
    const curveB = makeCurveLine(routerGroup.position, classBGroup.position, 0xa855f7);
    const curveC = makeCurveLine(routerGroup.position, classCGroup.position, 0x10b981);

    // ==========================================
    // MODE 3: 3D DATA PACKET FLOW LAB
    // ==========================================
    const packetsGroup = new THREE.Group();
    packetsGroupRef.current = packetsGroup;
    packetsGroup.visible = false;
    scene.add(packetsGroup);

    packetMeshesRef.current = [];
    const curves = [curveA, curveB, curveC];
    const packetColors = [0x06b6d4, 0xa855f7, 0x10b981, 0xf59e0b];

    for (let p = 0; p < 8; p++) {
      const pGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const pMat = new THREE.MeshStandardMaterial({
        color: packetColors[p % packetColors.length],
        emissive: packetColors[p % packetColors.length],
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      packetsGroup.add(pMesh);
      packetMeshesRef.current.push({
        mesh: pMesh,
        progress: Math.random(),
        speed: 0.15 + Math.random() * 0.15,
        curve: curves[p % curves.length],
      });
    }

    // Ambient floating network data particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = Math.random() * 8 - 1;
      particlePos[i + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particleSystemRef.current = particles;

    // Raycasting for interactive octet clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (evt: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (activeModeRef.current === 'octets' && octetGroupRef.current) {
        const intersects = raycaster.intersectObjects(octetCubesRef.current, true);
        if (intersects.length > 0) {
          // Find which octet root
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.name.startsWith('octet_')) {
            obj = obj.parent;
          }
          if (obj) {
            const index = Number(obj.name.replace('octet_', ''));
            if (!isNaN(index) && onSelectOctet) {
              onSelectOctet(index);
            }
          }
        }
      }
    };

    const handlePointerMove = (evt: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (activeModeRef.current === 'octets') {
        const intersects = raycaster.intersectObjects(octetCubesRef.current, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.name.startsWith('octet_')) {
            obj = obj.parent;
          }
          if (obj) {
            const index = Number(obj.name.replace('octet_', ''));
            setHoveredOctet(index);
            return;
          }
        }
      }
      setHoveredOctet(null);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // RENDER & ANIMATION LOOP
    // ==========================================
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Visibility toggles
      if (octetGroupRef.current) {
        octetGroupRef.current.visible = activeModeRef.current === 'octets';
      }
      if (topologyGroupRef.current) {
        topologyGroupRef.current.visible = activeModeRef.current === 'topology' || activeModeRef.current === 'packets';
      }
      if (packetsGroupRef.current) {
        packetsGroupRef.current.visible = activeModeRef.current === 'packets';
      }

      // Smooth exploded slider animation on octets
      if (activeModeRef.current === 'octets' && octetCubesRef.current.length === 4) {
        const targetOffset = explodedRef.current * 1.5;
        const currentIpData = analyzeIP(currentIpRef.current);
        const netMaskBytes = currentIpData?.defaultSubnetMask === '255.0.0.0'
          ? [1, 0, 0, 0]
          : currentIpData?.defaultSubnetMask === '255.255.0.0'
          ? [1, 1, 0, 0]
          : [1, 1, 1, 0];

        octetCubesRef.current.forEach((group, idx) => {
          const basePos = (idx - 1.5) * spacing;
          const explodeDir = (idx - 1.5);
          const targetX = basePos + explodeDir * targetOffset;
          group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 5, delta);

          // Subtle floating levitation
          group.position.y = Math.sin(elapsedTime * 2 + idx * 0.8) * 0.08;

          // Highlight NetID vs HostID
          const isNet = netMaskBytes[idx] === 1;
          const isSelected = selectedIndexRef.current === idx;
          const core = group.getObjectByName('core') as THREE.Mesh | undefined;
          if (core && core.material) {
            const mat = core.material as THREE.MeshStandardMaterial;
            const targetCol = isNet ? _colorNet : _colorHost;
            mat.color.lerp(targetCol, 0.1);
            mat.emissive.lerp(targetCol, 0.1);
            mat.emissiveIntensity = isSelected ? 0.9 : 0.45;
          }

          // Rotate slightly if selected
          if (isSelected) {
            group.rotation.y = Math.sin(elapsedTime * 3) * 0.15;
          } else {
            group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0, 4, delta);
          }
        });
      }

      // Topology rotations
      if (topologyGroupRef.current && topologyGroupRef.current.visible) {
        globe.rotation.y = elapsedTime * 0.2;
        ring.rotation.z = elapsedTime * 0.15;
        routerGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.05;
      }

      // Packet flows
      if (packetsGroupRef.current && packetsGroupRef.current.visible) {
        packetMeshesRef.current.forEach((p) => {
          p.progress = (p.progress + delta * p.speed) % 1.0;
          const pos = p.curve.getPointAt(p.progress, _vec3);
          p.mesh.position.copy(pos);
        });
      }

      // Background particle drift
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y = elapsedTime * 0.02;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.dispose();
    };
  }, []);

  // Update exploded distance when props change
  useEffect(() => {
    explodedRef.current = explodedOffset;
  }, [explodedOffset]);

  // Handle celebration trigger (pulse lighting or temporary flash)
  useEffect(() => {
    if (celebrateTrigger > 0 && sceneRef.current) {
      const flashLight = new THREE.PointLight(0x22c55e, 3.5, 12);
      flashLight.position.set(0, 2, 2);
      sceneRef.current.add(flashLight);
      setTimeout(() => {
        if (sceneRef.current) sceneRef.current.remove(flashLight);
      }, 700);
    }
  }, [celebrateTrigger]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top 3D Viewport Badges */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-1.5 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-bold text-cyan-200">
            {activeMode === 'octets' && 'محلل بايتات الـ IP ثلاثي الأبعاد'}
            {activeMode === 'topology' && 'فضاء الشبكات وفئات A / B / C'}
            {activeMode === 'packets' && 'محاكي توجيه حزم البيانات (Packets)'}
          </span>
        </div>

        {/* Legend for NetID vs HostID */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-1.5 shadow-lg text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span className="text-cyan-300">Net ID (عنوان الشبكة)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
            <span className="text-emerald-300">Host ID (عنوان الجهاز)</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip for Octets */}
      {hoveredOctet !== null && activeMode === 'octets' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/50 rounded-lg px-3 py-1 text-xs text-cyan-200 shadow-xl pointer-events-none z-10">
          انقر لتحديد وفحص البايت {hoveredOctet + 1}
        </div>
      )}
    </div>
  );
};
