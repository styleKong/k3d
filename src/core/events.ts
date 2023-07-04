const hasOwnProperty = Object.prototype.hasOwnProperty;
type event = THREE.Intersection<THREE.Object3D<THREE.Event>> | null;
export default class Events {
  handle: { [k: string]: ((e: event) => void)[] } = {};
  constructor() {}
  /**
   * 绑定事件
   * @param type 事件类型
   * @param fn 事件方法
   */
  on(type: string, fn: (e: event) => void) {
    if (!hasOwnProperty.call(this.handle, type)) this.handle[type] = [];
    // 将事件推入事件处理数组中
    this.handle[type].push(fn);
  }
  /**
   * 触发事件处理
   * @param event 事件对象
   */
  emit(type: string | { type: string; event: event }, event?: event) {
    if (typeof type == 'object') {
      event = type.event;
      type = type.type;
    }
    if (!type) throw '请指定事件类型';
    if (hasOwnProperty.call(this.handle, type) && this.handle[type] instanceof Array) {
      for (let index = 0; index < this.handle[type].length; index++) {
        // 执行事件处理
        if (typeof this.handle[type][index] == 'function') this.handle[type][index](event || null);
      }
    }
  }
  /**
   * 解绑事件
   * @param type 事件类型
   * @param fn   事件方法(不传则解绑所有方法)
   */
  off(type: string, fn?: (e: event) => void) {
    if (hasOwnProperty.call(this.handle, type)) {
      if (!fn) delete this.handle[type];
      // 过滤掉这个事件方法
      else this.handle[type] = this.handle[type].filter((item: (e: event) => void) => item !== fn);
    }
  }
}
