import * as THREE from 'three';
export default async function (
  url: string,
  onload: (mode: THREE.Mesh, mixer?: THREE.AnimationMixer, mixerActions?: THREE.AnimationAction[]) => void
) {
  const extension = url.split('.').pop()?.toLowerCase();
  let loader: { [key: string]: any } | undefined;
  switch (extension) {
    case 'gltf':
    case 'glb': {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
      loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('./examples/jsm/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
      break;
    }
    case 'obj': {
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
      loader = new OBJLoader();
      break;
    }
    case 'pcd': {
      const { PCDLoader } = await import('three/examples/jsm/loaders/PCDLoader.js');
      loader = new PCDLoader();
      break;
    }
    case '3mf': {
      const { ThreeMFLoader } = await import('three/examples/jsm/loaders/3MFLoader.js');
      loader = new ThreeMFLoader();
      break;
    }
  }

  // 如果没有找到对应后缀的加载器，返回
  if (!loader) throw new Error('k3d中未实现对' + extension + '格式文件的加载');
  // glb 和 gltf格式的模型加载回调
  function glbBack(gltf: { [a: string]: any }) {
    const mode = gltf.scene;
    const mixer = new THREE.AnimationMixer(mode);
    const mixerActions = [];
    // 收集动画
    if (gltf.animations && gltf?.animations?.length > 0) {
      mode.animations = gltf.animations;
      for (let i = 0; i < gltf.animations.length; i++) {
        mixerActions.push(mixer.clipAction(gltf.animations[i]));
      }
      // 将模型动画剪辑列表添加到模型，以便使用
      Object.defineProperty(mode, 'mixerActions', { value: mixerActions, enumerable: true });
    }
    onload(mode, mixer, mixerActions);
  }
  loader.load(url, ['gltf', 'glb'].includes(extension as string) ? glbBack : onload);
}
