import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

export default function initResize(
  domElement: HTMLElement,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  render: THREE.WebGLRenderer,
  css2dRenderer?: CSS2DRenderer,
  css3dRenderer?: CSS3DRenderer,
  effectComposer?: EffectComposer,
  callBack?: () => void
) {
  function resize() {
    const width = domElement.clientWidth
    const height = domElement.clientHeight
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      ;(camera as THREE.OrthographicCamera).left = width / -2
      ;(camera as THREE.OrthographicCamera).right = width / 2
      ;(camera as THREE.OrthographicCamera).top = height / 2
      ;(camera as THREE.OrthographicCamera).bottom = height / -2
    } else {
      ;(camera as THREE.PerspectiveCamera).aspect = width / height
    }
    camera.updateProjectionMatrix()
    effectComposer && effectComposer.setSize(width, height)
    render.setSize(width, height)
    css2dRenderer && css2dRenderer.setSize(width, height)
    css3dRenderer && css3dRenderer.setSize(width, height)
    if (typeof callBack == 'function') callBack()
  }
  window.addEventListener('resize', resize)
  return function () {
    window.removeEventListener('resize', resize)
  }
}
