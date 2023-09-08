import { Clock, EventDispatcher } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

/**
 *  创建渲染动画
 *  可通过addEventListener等方法来绑定render事件
 *  dispose 解绑所有render事件（和类中使用的window的resize事件和contorls的change事件）
 */

export default class InitAnimate extends EventDispatcher {
  contorls!: OrbitControls
  renderer!: THREE.WebGLRenderer
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera | THREE.OrthographicCamera
  stats?: Stats
  css2dRenderer?: CSS2DRenderer
  css3dRenderer?: CSS3DRenderer
  effectComposer?: EffectComposer
  demand: boolean = false
  clock = new Clock()
  renderEvent = () => {
    this.render()
  }
  constructor(config: {
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
    contorls: OrbitControls
    // 后期处理
    effectComposer?: EffectComposer
    css2dRenderer?: CSS2DRenderer
    css3dRenderer?: CSS3DRenderer
    // 是否按需渲染
    demand?: boolean
  }) {
    super()
    this.contorls = config.contorls
    this.renderer = config.renderer
    this.scene = config.scene
    this.camera = config.camera
    if (config.effectComposer) this.effectComposer = config.effectComposer
    if (config.css2dRenderer) this.css2dRenderer = config.css2dRenderer
    if (config.css3dRenderer) this.css3dRenderer = config.css3dRenderer
    if (config.demand) this.demand = config.demand
    if (config.demand) {
      this.contorls.addEventListener('change', this.renderEvent)
      window.addEventListener('resize', this.renderEvent)
      this.renderEvent()
    } else this.animate()
  }
  dispose() {
    this.contorls.removeEventListener('change', this.renderEvent)
    window.removeEventListener('change', this.renderEvent)
    if ((this as any)._listeners) delete (this as any)._listeners.render
  }
  animate() {
    if (!this.demand) requestAnimationFrame(() => this.animate())
    this.render()
  }
  render() {
    const delta = this.clock.getDelta()
    if (this.stats) this.stats.update()
    this.contorls.update()
    if (this.effectComposer) this.effectComposer.render(delta)
    else this.renderer.render(this.scene, this.camera)
    if (this.css2dRenderer) this.css2dRenderer.render(this.scene, this.camera)
    if (this.css3dRenderer) this.css3dRenderer.render(this.scene, this.camera)
    this.dispatchEvent({
      type: 'render',
      scene: this.scene,
      renderer: this.renderer,
      camera: this.camera,
      contorls: this.contorls,
      demand: this.demand
    })
  }
}
