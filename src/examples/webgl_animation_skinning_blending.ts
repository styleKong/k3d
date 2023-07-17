import K3d from '../core/index';
import * as THREE from 'three';

export default function (container) {
  const k3d = new K3d(container, {
    stats: true,
    scene: {
      // background: './textures/carbon/Carbon.png',
      background: 0xa0a0a0,
      gui: true,
    },
    fog: {
      color: 0xa0a0a0,
      near: 10,
      far: 15,
      gui: true,
    },
    perspectiveCamera: {
      near: 1,
      fov: 45,
      far: 1000,
      position: [1, 2, -3],
      target: [0, 1, 0],
      gui: true,
    },
    hemisphereLight: {
      color: 0xffffff,
      groundColor: 0x444444,
      position: [0, 20, 0],
    },
    directionalLight: {
      color: 0xffffff,
      position: [-3, 10, -10],
    },
    shadow: {
      near: 0.1,
      far: 40,
    },
    controls: {
      target: [0, 0.5, 0],
      enablePan: false,
      enableDamping: true,
    },
    models: ['./models/gltf/Soldier.glb'],
    render: {
      outputEncoding: THREE.sRGBEncoding,
      antialias: true,
    },
    onprogress(gltf: THREE.Mesh) {
      k3d.mixerActions[gltf.name][1].play();
    },
    onLoad(k3d: K3d) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      k3d.scene.add(mesh);
    },
  });
  return k3d;
}
