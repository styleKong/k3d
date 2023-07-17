import K3d from '../core/index';
import * as THREE from 'three';
export default function (container) {
  const k3d = new K3d(container);
  k3d.addScene({
    background: 0xa0a0a0,
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  k3d.scene.add(mesh);
  (window as any).camera = k3d.addPerspectiveCamera({
    near: 1,
    fov: 45,
    far: 100,
    position: [-1, 2, 3],
    target: [0, 8, 0],
  });
  k3d.addRenderer({
    antialias: true,
  });
  k3d.addFog({
    color: 0xa0a0a0,
    near: 10,
    far: 50,
  });
  k3d.addHemisphereLight({
    color: 0xffffff,
    groundColor: 0x444444,
    position: [0, 20, 0],
  });
  k3d.addDirectionalLight({
    color: 0xffffff,
    position: [3, 10, 10],
  });
  k3d.addOrbitControls({});
  const shadow = k3d.addShadow({
    near: 0.1,
    far: 40,
    gui: true,
  });
  k3d.modelLoad('./models/gltf/Xbot.glb').then((gltf) => {
    (gltf as Record<string, any>).mixerActions[1].play();
  });
  k3d.animate();
  return k3d;
}
