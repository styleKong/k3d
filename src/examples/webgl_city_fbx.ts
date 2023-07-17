import * as THREE from 'three';
import K3d from '../core/index';

export default async function (container) {
  const k3d = new K3d(container);
  k3d.addScene();
  k3d.addRenderer();
  k3d.addPerspectiveCamera({
    fov: 45,
    near: 1,
    far: 100000,
    position: [24520.907127727995, 14001.27928468518, -8573.988325424087],
  });
  k3d.addAmbientLight({
    color: 0x404040,
  });
  k3d.addDirectionalLight({
    color: 0xffffff,
    position: [24520, 14001, 8573],
  });
  k3d.addShadow({
    far: 100000,
    gui: true,
  });
  await k3d.addOrbitControls();
  const model = k3d.modelLoad('./models/fbx/city.fbx');
  (await model).traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.receiveShadow = true;
    }
  });
  k3d.animate();
  console.log(k3d.outDescartes());
  (window as any).outDescartes = k3d.outDescartes.bind(k3d);
  return k3d;
}
