import K3d from '../core/index';
import * as THREE from 'three';
export default function (container) {
  const k3d = new K3d({
    gui: true,
    stats: true,
    domElement: container,
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
      radius: 0.26,
      threshold: 0,
      gui: true,
    },
    camera: {
      type: 'PerspectiveCamera',
      fov: 40,
      far: 100,
      near: 1,
      position: [-5, 2.5, -3.5],
      gui: true,
    },
    light: {
      AmbientLight: {
        color: '#404040',
        gui: true,
      },
    },
    renderRequested: false,
    models: ['./models/gltf/PrimaryIonDrive.glb'],
    onprogress(gltf: THREE.Mesh | THREE.Group) {
      k3d.renderRequested = true;
      (gltf as Record<string, any>).mixerActions[0].play();
    },
    onload(k3d: K3d) {
      const pointLight = new THREE.PointLight(0xffffff, 1);
      k3d.camera.add(pointLight);
    },
  });
  return k3d;
}
