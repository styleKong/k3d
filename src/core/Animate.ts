import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import TWEEN from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
/**
 * 帧动画类
 *  tweens 默认不传，默认使用TWEEN.update更新补间动画
 */
export default class Animate extends THREE.EventDispatcher {
  scene: THREE.Scene;
  camera: THREE.Camera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  clock = new THREE.Clock();
  tweens: (typeof TWEEN.Tween<any>)[] = [];
  mixers: THREE.AnimationMixer[] = [];
  gui?: GUI;
  composer?: EffectComposer;
  stats?: Stats;
  _renderRequested = false;
  _demand = false;
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls,
    renderer: THREE.WebGLRenderer,
    composer?: EffectComposer
  ) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    if (composer) this.composer = composer;
  }
  addMixer(...args: THREE.AnimationMixer[]) {
    this.mixers.push(...args);
  }
  addTween(...args: (typeof TWEEN.Tween<any>)[]) {
    this.tweens.push(...args);
  }
  addGui(gui: GUI) {
    this.gui = gui;
  }
  addStats(stats: Stats) {
    this.stats = stats;
  }
  addComposer(composer: EffectComposer) {
    this.composer = composer;
  }
  bindChange = () => {
    if (this.gui) this.gui.onChange(this.renderEvent);
    this.controls.addEventListener('change', this.renderEvent);
    window.addEventListener('resize', this.renderEvent);
  };
  dispose() {
    this.controls.removeEventListener('change', this.renderEvent);
    window.removeEventListener('resize', this.renderEvent);
    (this as any)._listeners = null;
  }

  /**
   * 按需渲染是执行
   */
  renderEvent = () => {
    if (!this._renderRequested) {
      this._renderRequested = true;
      requestAnimationFrame(() => this.render());
    }
  };
  /**
   * 帧动画
   */
  animate() {
    if (!this._demand) requestAnimationFrame(() => this.animate());
    this.render();
  }
  render() {
    if (this._demand) this._renderRequested = false;
    const delta = this.clock.getDelta();
    this.controls.update();
    if (this.composer) this.composer.render(delta);
    else this.renderer.render(this.scene, this.camera);
    this.tweens.forEach((item) => {
      (item as any).update(delta);
    });
    TWEEN.update();
    this.mixers.forEach((item) => {
      item.update(delta);
    });
    if (this.stats) this.stats.update();
    this.dispatchEvent({
      type: 'render',
      delta,
    });
  }
}
