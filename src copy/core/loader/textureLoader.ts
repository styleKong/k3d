import * as THREE from 'three';
export default async function (url: string) {
  let loader;
  if (/hdr$/i.test(url)) {
    const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
    loader = new RGBELoader();
  } else {
    loader = new THREE.TextureLoader();
  }
  return loader.load(url);
}
