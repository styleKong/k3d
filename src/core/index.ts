import ResourceTracker from './ResourceTracker';
import initScene from './initScene';
let a: Parameters<typeof initScene>;
type ToObject<T extends Array<string>, U extends Array<any>> = {
  [index in keyof T]: index extends keyof U ? U[index] : never;
};
let b: ToObject<['config', 'gui'], Parameters<typeof initScene>>;
export default class extends ResourceTracker {
  domElement: HTMLElement;
  constructor(domElement: HTMLElement, config: {}) {
    super();
    this.domElement = domElement;
  }
}
