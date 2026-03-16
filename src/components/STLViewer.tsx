"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Props {
  stlUrl: string;
}

export default function STLViewer({ stlUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x09090b, 1); // zinc-950
    container.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // Load STL
    let geometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh | null = null;

    const loader = new STLLoader();
    loader.load(
      stlUrl,
      (geo) => {
        geometry = geo;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        const sphere = geometry.boundingSphere!;
        const center = sphere.center;
        const radius = sphere.radius;

        geometry.translate(-center.x, -center.y, -center.z);
        const scale = 2 / radius;
        geometry.scale(scale, scale, scale);

        const material = new THREE.MeshPhongMaterial({
          color: 0xf97316, // orange-500
          specular: 0x888888,
          shininess: 40,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Isometric-style view: slightly above, in front, to the side
        camera.position.set(1.5, 2.5, 3.5);
        controls.target.set(0, 0, 0);
        controls.update();
      },
      undefined,
      (err) => console.error("STL load error", err)
    );

    // Animation loop
    let animFrameId: number;
    function animate() {
      animFrameId = requestAnimationFrame(animate);
      if (mesh) mesh.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler — ResizeObserver fires on any layout change, not just window resize
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId);
      controls.dispose();
      ro.disconnect();
      geometry?.dispose();
      if (mesh) {
        (mesh.material as THREE.Material).dispose();
        scene.remove(mesh);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stlUrl]);

  return <div ref={containerRef} className="w-full h-full" />;
}
