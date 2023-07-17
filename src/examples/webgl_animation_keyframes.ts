import K3d from '../core/index';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export default function (container) {
  const k3d = new K3d(container);
  k3d.addScene();
  let camera = k3d.addPerspectiveCamera({
    near: 1,
    fov: 40,
    far: 100,
    position: [5, 2, 8],
  });
  let renderer = k3d.addRenderer({
    antialias: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  const pmremGenerator = new THREE.PMREMGenerator(k3d.renderer);
  k3d.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  k3d.scene.background = new THREE.Color(0xbfe3dd);
  k3d.addOrbitControls({ gui: true });
  k3d.addStats();
  k3d.modelLoad('./models/gltf/LittlestTokyo.glb').then((gltf) => {
    gltf.scale.set(0.01, 0.01, 0.01);
    (gltf as any).mixerActions[0].play();
  });
  k3d.animate();
  return k3d;
}
