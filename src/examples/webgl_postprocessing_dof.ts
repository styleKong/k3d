import K3d from '../core/index';
import * as THREE from 'three';

export default function (container) {
  let mouseX = 0,
    mouseY = 0,
    singleMaterial = false,
    zmaterial,
    nobjects;

  const materials = [],
    objects = [];

  const k3d = new K3d(container, {
    stats: true,
    render: {},
    scene: {},
    dof: {
      focus: 500.0,
      aperture: 5,
      maxblur: 0.01,
    },
    perspectiveCamera: {
      near: 1,
      fov: 70,
      far: 3000,
      position: [0, 200, 0],
      gui: true,
    },
    onLoad(k3d: K3d) {
      k3d.renderer.autoClear = false;
      const path = './textures/cube/SwedishRoyalCastle/';
      const format = '.jpg';
      const urls = [
        path + 'px' + format,
        path + 'nx' + format,
        path + 'py' + format,
        path + 'ny' + format,
        path + 'pz' + format,
        path + 'nz' + format,
      ];
      const textureCube = new THREE.CubeTextureLoader().load(urls);

      let parameters = { color: 0xff1100, envMap: textureCube };
      let cubeMaterial = new THREE.MeshBasicMaterial(parameters);

      if (singleMaterial) zmaterial = [cubeMaterial];

      const geo = new THREE.SphereGeometry(1, 20, 10);

      const xgrid = 14,
        ygrid = 9,
        zgrid = 14;

      nobjects = xgrid * ygrid * zgrid;

      const s = 60;
      let count = 0;

      for (let i = 0; i < xgrid; i++) {
        for (let j = 0; j < ygrid; j++) {
          for (let k = 0; k < zgrid; k++) {
            let mesh;

            if (singleMaterial) {
              mesh = new THREE.Mesh(geo, zmaterial);
            } else {
              mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(parameters));
              materials[count] = mesh.material;
            }

            const x = 200 * (i - xgrid / 2);
            const y = 200 * (j - ygrid / 2);
            const z = 200 * (k - zgrid / 2);

            mesh.position.set(x, y, z);
            mesh.scale.set(s, s, s);

            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();

            k3d.scene.add(mesh);
            objects.push(mesh);

            count++;
          }
        }
      }
    },
  });
  k3d.domElement.addEventListener('pointermove', (event) => {
    if (event.isPrimary === false) return;

    mouseX = event.clientX - k3d.width / 2;
    mouseY = event.clientY - k3d.height / 2;
  });
  k3d.addEventListener('loop', () => {
    const time = Date.now() * 0.00005;
    k3d.camera.position.x += (mouseX - k3d.camera.position.x) * 0.036;
    k3d.camera.position.y += (-mouseY - k3d.camera.position.y) * 0.036;

    k3d.camera.lookAt(k3d.scene.position);

    if (!singleMaterial) {
      for (let i = 0; i < nobjects; i++) {
        const h = ((360 * (i / nobjects + time)) % 360) / 360;
        materials[i].color.setHSL(h, 1, 0.5);
      }
    }
  });
  return k3d;
}
