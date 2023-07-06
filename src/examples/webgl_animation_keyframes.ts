import K3d from '../core/index';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function (container) {
  const k3d = new K3d({
    gui: true,
    stats: true,
    domElement: container,
    scene: {
      // background: await new THREE.TextureLoader().loadAsync('./textures/carbon/Carbon.png'),
      background: 0xbfe3dd,
      gui: true,
    },
    camera: {
      type: 'PerspectiveCamera',
      near: 1,
      fov: 40,
      far: 100,
      position: [5, 2, 8],
      gui: true,
    },
    controls: {
      target: [0, 0.5, 0],
      enablePan: false,
      enableDamping: true,
    },
    models: ['./models/gltf/LittlestTokyo.glb'],
    render: {
      antialias: true,
    },
    onprogress(gltf: THREE.Mesh) {
      gltf.scale.set(0.01, 0.01, 0.01);
      k3d.mixerActions[gltf.name][0].play();
    },
    onload(k3d: K3d) {
      k3d.renderer.outputEncoding = THREE.sRGBEncoding;
      const pmremGenerator = new THREE.PMREMGenerator(k3d.renderer);
      k3d.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    },
  });
  return k3d;
}
