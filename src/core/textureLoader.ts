import * as THREE from 'three';
export default async function (url: string, fn: (textrue: any) => void) {
  let loader;
  if (/hdr$/i.test(url)) {
    const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
    loader = new RGBELoader();
  } else {
    loader = new THREE.TextureLoader();
  }
  loader.load(url, fn);
}
