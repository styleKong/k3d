import * as THREE from 'three';
import _ from 'lodash';
export default class extends THREE.EventDispatcher {
  clickTime = 0;
  clickTimer = null;
  raycasterObjects = [];
  clickObjects = [];
  hoverObjects = [];
  button = -1;
  downPoint = [];
  domElement: HTMLElement;
  camera: THREE.Camera;
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  constructor(domElement: HTMLElement, camera: THREE.Camera) {
    super();
    this.domElement = domElement;
    this.camera = camera;
    this.domElement.addEventListener('contextmenu', this.contextmenu);
  }
  contextmenu = (e: PointerEvent) => {
    e.preventDefault();
  };
  addEventListener(type: string, listener: (...args: any) => void) {
    super.addEventListener(type, listener);
    if (['click', 'dblclick'].includes(type)) this.domElement.addEventListener('mousedown', this.mousedown);
    else if (type == 'hover') this.domElement.addEventListener('pointermove', this.pointermove);
  }
  removeEventListener(type: string, listener: (...args: any) => void) {
    super.removeEventListener(type, listener);
    if (!(this as any)._listeners[type] || (this as any)._listeners[type].length == 0) {
      if (['click', 'dblclick'].includes(type)) this.domElement.removeEventListener('mousedown', this.mousedown);
      else if (type == 'hover') this.domElement.removeEventListener('pointermove', this.pointermove);
    }
  }
  mousedown = (event: PointerEvent) => {
    this.domElement.addEventListener('mouseup', this.mouseup);
    this.downPoint[0] = event.clientX;
    this.downPoint[1] = event.clientY;
    this.clickTimer = setTimeout(() => {
      this.domElement.removeEventListener('mouseup', this.mouseup);
    }, 300);
  };
  mouseup = (event: PointerEvent) => {
    if (this.clickTimer) clearTimeout(this.clickTimer);
    if (this.button !== event.button) this.clickTime = 0;
    this.button = event.button;
    this.domElement.removeEventListener('mouseup', this.mouseup);
    // 计算鼠标按下点和鼠标松开点距离
    const L = Math.sqrt((event.clientX - this.downPoint[0]) ** 2 + (event.clientY - this.downPoint[1]) ** 2);
    if (L > 10) return;
    this.clickTime++;
    this.clickTimer = setTimeout(() => {
      this.raycasterObjects = this.clickObjects;
      this.onPointerMove(event);
      this.render();
      const target = (this as any).intersects[0];
      if (target && this.button == 0) {
        if (this.clickTime == 1) {
          this.dispatchEvent({ type: 'click', ...target });
        } else if (this.clickTime == 2) {
          this.dispatchEvent({ type: 'dblclick', ...target });
        }
      } else if (event.button == 2) {
        this.dispatchEvent({ type: 'rightclick', ...target });
      }
      this.clickTime = 0;
    }, 300);
  };
  pointermove = _.throttle((event: PointerEvent) => {
    this.raycasterObjects = this.hoverObjects.length ? this.hoverObjects : this.clickObjects;
    this.onPointerMove(event);
    this.render();
    const target = (this as any).intersects[0];
    console.log((this as any).intersects);
    if (target)
      this.dispatchEvent({
        type: 'hover',
        ...target,
      });
  }, 300);
  onPointerMove(event: PointerEvent) {
    const domPointer = this.domElement.getBoundingClientRect();
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    this.pointer.x = ((event.clientX - domPointer.x) / domPointer.width) * 2 - 1;
    this.pointer.y = -((event.clientY - domPointer.y) / domPointer.height) * 2 + 1;
  }
  render() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    (this as any).intersects = this.raycaster.intersectObjects(this.raycasterObjects);
  }
  dispose() {
    this.domElement.removeEventListener('mousedown', this.mousedown);
    this.domElement.removeEventListener('pointermove', this.pointermove);
    this.domElement.removeEventListener('mouseup', this.mouseup);
    this.domElement.removeEventListener('contextmenu', this.contextmenu);
    delete (this as any)._listeners.click;
    delete (this as any)._listeners.dblclick;
    delete (this as any)._listeners.hover;
    delete (this as any)._listeners.rightclick;
  }
}
