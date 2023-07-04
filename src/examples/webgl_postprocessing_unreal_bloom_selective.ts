import K3d from '../core/index';
import * as THREE from 'three';
export default function (container) {
  const BLOOM_SCENE = 1;
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
      strength: 1.1,
      radius: 0,
      threshold: 0,
      gui: true,
    },
    camera: {
      type: 'PerspectiveCamera',
      fov: 40,
      far: 200,
      near: 1,
      position: [0, 0, 20],
      gui: true,
    },
    outline: {
      visibleEdgeColor: '#fff',
    },
    light: {
      AmbientLight: {
        color: '#404040',
        gui: true,
      },
    },
    renderEnabled: false,
    onprogress(gltf: THREE.Mesh | THREE.Group) {},
    onload(k3d: K3d) {
      setupScene();
    },
  });

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
        sphere.layers.enable(BLOOM_SCENE);
        k3d.addBloom(sphere);
      }
      k3d.timeRender();
    }
  }
  k3d.on('click', (obj: any) => {
    if (obj && obj.object.isMesh) {
      k3d.toggleBloom(obj.object);
      k3d.outlineObjects.toggle(obj.object);
    }
  });
  return k3d;
}
