import * as THREE from 'three';
export default class modelLoader {
  constructor(scene) {
    this.scene = scene;
  }
  async getLoader() {
    const extension = url.split('.').pop()?.toLowerCase();
    let loader;
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
      case 'fbx': {
        const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
        loader = new FBXLoader();
        break;
      }
    }
    return loader;
  }
  async load(url, onLoad, onProgress, onError) {
    let loader = await this.getLoader(url);
    loader.load(url, onLoad, onProgress, onError);
  }
}
