import { ACESFilmicToneMapping, Color, PCFSoftShadowMap, WebGLRenderer } from 'three'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

export default function (
  domElemnt: HTMLElement,
  config?: { alpha?: boolean; antialias?: boolean },
  gui?: GUI
): THREE.WebGLRenderer {
  const renderer = new WebGLRenderer(config)
  renderer.setSize(domElemnt.clientWidth, domElemnt.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  domElemnt.appendChild(renderer.domElement)
  renderer.autoClear = false
  if (gui) {
    const folder = gui.addFolder('WebGLRenderer')
    folder.add(renderer, 'alpha')
    folder.add(renderer, 'antialias')
  }
  return renderer
}
