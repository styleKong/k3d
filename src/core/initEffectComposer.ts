import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { WebGLRenderTarget, sRGBEncoding } from 'three'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export default function initEffectComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  renderPass: RenderPass,
  renderTarget?: THREE.WebGLRenderTarget,
  domElement?: HTMLElement
) {
  if (!domElement) domElement = renderer.domElement
  const effectComposer = new EffectComposer(renderer, renderTarget)
  effectComposer.setPixelRatio(window.devicePixelRatio)
  effectComposer.setSize(domElement.clientWidth, domElement.clientHeight)
  effectComposer.addPass(renderPass)
  const gammaPass = new ShaderPass(GammaCorrectionShader)
  effectComposer.addPass(gammaPass)
  return effectComposer
}
