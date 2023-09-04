import _ from 'lodash'
import { EventDispatcher, Raycaster, Vector2, WebGLRenderer } from 'three'
/**
 * 创建事件
 * 默认触发click、hover事件
 * 应用射线检测获取选中的物体
 * dispose 解绑所有click、hover事件（和类中使用的window的resize事件和contorls的change事件）
 */
export default class InitHandle extends EventDispatcher {
  clickObjects!: THREE.Object3D<THREE.Event>[]
  hoverObjects!: THREE.Object3D<THREE.Event>[]
  renderer!: WebGLRenderer
  camera!: THREE.PerspectiveCamera | THREE.OrthographicCamera
  constructor(
    renderer: WebGLRenderer,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    clickObjects?: THREE.Object3D<THREE.Event>[],
    hoverObjects?: THREE.Object3D<THREE.Event>[]
  ) {
    super()
    this.clickObjects = clickObjects || []
    this.hoverObjects = hoverObjects || clickObjects || []
    this.renderer = renderer
    this.camera = camera
    this.bindEvent()
  }
  // 绑定点击事件
  bindClick = () => {
    const _this = this
    // 鼠标松开触发
    function mouseup(event: MouseEvent) {
      const target = _this.getSelectObject(event, _this.clickObjects)
      if (target)
        _this.dispatchEvent({
          type: 'click',
          ...target
        })
    }
    this.renderer.domElement.addEventListener('mouseup', mouseup)

    // 当按下时间超过200ms,解绑鼠标放开事件
    const timer = setTimeout(() => {
      clearTimeout(timer)
      this.renderer.domElement.removeEventListener('mouseup', mouseup)
    }, 200)
  }
  bindHover = _.throttle((event: MouseEvent) => {
    const target = this.getSelectObject(event, this.hoverObjects)
    if (target)
      this.dispatchEvent({
        type: 'hover',
        ...target
      })
  }, 200)
  bindEvent() {
    // 模拟点击事件
    this.renderer.domElement.addEventListener('mousedown', this.bindClick)
    // 模拟hover事件
    this.renderer.domElement.addEventListener('pointermove', this.bindHover)
  }
  getSelectObject(
    event: MouseEvent,
    raycasterObjects: THREE.Object3D<THREE.Event>[]
  ): THREE.Intersection<THREE.Object3D<THREE.Event>> {
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(pointer, this.camera as THREE.Camera)
    // 计算物体和射线的焦点
    const intersects = raycaster.intersectObjects(raycasterObjects)
    return intersects[0]
  }
  dispose() {
    // 模拟点击事件
    this.renderer.domElement.removeEventListener('mousedown', this.bindClick)
    // 模拟hover事件
    this.renderer.domElement.removeEventListener('pointermove', this.bindHover)
    if ((this as any)._listeners) delete (this as any)._listeners.click
    if ((this as any)._listeners) delete (this as any)._listeners.hover
  }
}
