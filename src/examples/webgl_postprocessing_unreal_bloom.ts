import K3d from '../core/index';
import * as THREE from 'three';
export default function (container) {
  const k3d = new K3d(container, {
    stats: true,
    render: {
      antialias: true,
      toneMapping: THREE.ReinhardToneMapping,
      toneMappingExposure: 1,
      gui: true,
    },
    controls: {
      enableDamping: true,
    },
    bloom: {
      strength: 1.5,
      radius: 0,
      threshold: 0,
      gui: true,
    },
    perspectiveCamera: {
      fov: 40,
      far: 100,
      near: 1,
      position: [-5, 2.5, -3.5],
      gui: true,
    },
    ambientLight: {
      color: 0x404040,
      gui: true,
    },
    renderRequested: true,
    models: ['./models/gltf/PrimaryIonDrive.glb'],
    onprogress(gltf: THREE.Mesh | THREE.Group) {
      (gltf as Record<string, any>).mixerActions[0].play();
    },
    onLoad(k3d: K3d) {
      const pointLight = new THREE.PointLight(0xffffff, 1);
      k3d.camera.add(pointLight);
    },
  });
  return k3d;
}
