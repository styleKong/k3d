import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

export default function initEffectComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  renderPass: RenderPass,
  domElement?: HTMLElement
) {
  const effectComposer = new EffectComposer(renderer)
  if (!domElement) domElement = renderer.domElement
  effectComposer.setPixelRatio(window.devicePixelRatio)
  effectComposer.setSize(domElement.clientWidth, domElement.clientHeight)
  effectComposer.addPass(renderPass)
  return effectComposer
}
