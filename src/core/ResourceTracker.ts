import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import type Stats from 'three/examples/jsm/libs/stats.module.js'
/**
 * 主要是收集资源&&事件以便释放资源
 */
export default class K3d extends THREE.EventDispatcher {
  resources = new Set()
  domElement: HTMLElement = document.body
  clock: THREE.Clock = new THREE.Clock()
  stats?: Stats
  /**
   * 按需渲染
   */
  private _demand: boolean = false
  private _closeDemand?: () => void
  private _renderRequested: boolean = false
  constructor(domElement?: HTMLElement) {
    super()
    if (domElement) this.domElement = domElement
    else {
      this.domElement.style.width = '100%'
      this.domElement.style.height = '100vh'
    }
    window.addEventListener('resize', this.onResize)
    this.animate()
  }
  onResize = () => {
    this.dispatchEvent({
      type: 'resize',
      width: this.domElement.clientWidth,
      height: this.domElement.clientHeight,
      dpr: window.devicePixelRatio
    })
    if (this._demand) this.renderEvent()
  }
  /**渲染相关 start */
  /**
   * 开启按需渲染
   * @param controls 控制器
   * @param gui GUI
   * @returns dispose
   */
  openDemand(controls?: OrbitControls, gui?: GUI): () => void {
    this._demand = true
    if (controls) controls.addEventListener('change', this.renderEvent)
    if (gui) gui.onChange(this.renderEvent)
    this.addEventListener('resize', this.renderEvent)
    this._closeDemand = () => {
      if (controls) controls.removeEventListener('change', this.renderEvent)
      if (gui) gui.onChange(() => undefined)
    }
    return this._closeDemand
  }
  /**
   * 按需渲染是执行
   */
  renderEvent = () => {
    if (!this._renderRequested) {
      this._renderRequested = true
      requestAnimationFrame(() => this.render())
    }
  }
  /**
   * 帧动画
   */
  animate() {
    if (!this._demand) requestAnimationFrame(() => this.animate())
    this.render()
  }
  render() {
    if (this._demand) this._renderRequested = false
    const delta = this.clock.getDelta()
    if (this.stats) this.stats.update()
    this.dispatchEvent({
      type: 'render',
      delta
    })
  }
  /**渲染相关 end */
  /**
   * 解绑事件(重写removeEventListener)
   * @param type
   * @param listener
   */
  removeEventListener<T extends string>(
    type: T,
    listener?: THREE.EventListener<THREE.Event, T, this>
  ): void {
    if (!listener) {
      delete (this as any)._listeners[type]
    } else {
      super.removeEventListener(type, listener)
    }
  }
  /** 释放资源 start */

  /**
   * 资源收集
   * @param resource
   * @returns
   */
  track(resource: any) {
    if (!resource) {
      return resource
    }
    // handle children and when material is an array of materials.
    if (Array.isArray(resource)) {
      resource.forEach((resource) => this.track(resource))
      return resource
    }
    if (resource.dispose || resource instanceof THREE.Object3D) {
      this.resources.add(resource)
    }
    if (resource instanceof THREE.Object3D) {
      this.track((resource as any).geometry)
      this.track((resource as any).material)
      this.track(resource.children)
    } else if (resource instanceof THREE.Material) {
      // We have to check if there are any textures on the material
      for (const value of Object.values(resource)) {
        if (value instanceof THREE.Texture) {
          this.track(value)
        }
      }
      // We also have to check if any uniforms reference textures or arrays of textures
      if ((resource as any).uniforms) {
        for (const value of Object.values((resource as any).uniforms)) {
          if (value) {
            const uniformValue = (value as { value: any }).value
            if (uniformValue instanceof THREE.Texture || Array.isArray(uniformValue)) {
              this.track(uniformValue)
            }
          }
        }
      }
    }
    return resource
  }
  /**
   * 取消资源收集
   * @param resource
   */
  untrack(resource: any) {
    this.resources.delete(resource)
  }
  /**
   * 释放资源和事件
   */
  dispose() {
    if (this._closeDemand) this._closeDemand()
    this.removeEventListener('resize')
    this.removeEventListener('render')
    window.removeEventListener('resize', this.onResize)
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource)
        }
      }
      if ((resource as any).dispose) {
        ;(resource as any).dispose()
      }
    }
    this.resources.clear()
  }
  /** 释放资源 end */
}
