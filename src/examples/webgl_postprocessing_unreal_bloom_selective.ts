import K3d from '../core/index';
import * as THREE from 'three';
export default async function (container) {
  const k3d = new K3d(container);
  k3d.addStats();
  k3d.addScene({
    background: '#444444',
  });
  const render = k3d.addRenderer({
    antialias: true,
  });
  render.toneMapping = THREE.ReinhardToneMapping;
  render.toneMappingExposure = 1;
  k3d.addPerspectiveCamera({
    fov: 40,
    far: 200,
    near: 1,
    position: [0, 0, 20],
  });
  await k3d.addOrbitControls({ enableDamping: true });
  await k3d.initBloom({
    strength: 1,
    radius: 0,
    threshold: 0,
  });
  await k3d.addOutLine({
    visibleEdgeColor: '#fff',
  });
  k3d.addAmbientLight({ color: '#404040' });
  k3d.bindEvent();
  k3d.animate();
  function setupScene() {
    const geometry = new THREE.IcosahedronGeometry(1, 15);
    for (let i = 0; i < 50; i++) {
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = Math.random() * 10 - 5;
      sphere.position.y = Math.random() * 10 - 5;
      sphere.position.z = Math.random() * 10 - 5;
      sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0);
      sphere.scale.setScalar(Math.random() * Math.random() + 0.5);
      k3d.scene.add(sphere);
      k3d.clickObjects.add(sphere);
      k3d.hoverObjects.add(sphere);
      if (Math.random() < 0.25) {
        k3d.addBloom(sphere);
      }
    }
  }
  setupScene();
  k3d.addEventListener('click', function (obj: any) {
    if (obj.object && obj.object.isMesh) {
      k3d.toggleBloom(obj.object);
      k3d.outlineObjects.toggle(obj.object);
    }
  });
  return k3d;
}
