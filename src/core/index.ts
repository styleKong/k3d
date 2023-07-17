///<reference path = "../types/K3d.d.ts" />
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import WebGL from './WebGL';
import { type DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { type OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { type FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { type PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { type TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { type TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import Stats from 'three/examples/jsm/libs/stats.module.js';

// 后期渲染关键库
import { type EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { type RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { type ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { type BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

import { type OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

import { type UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { type CSS2DRenderer, type CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { type CSS3DRenderer, type CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import modeLoader from './modeLoader';
import textureLoader from './textureLoader';

// GUI
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import _ from 'lodash';

const BLOOM_SCENE = 3;
// 判断是否是颜色
function isColor(color): boolean {
  if (color instanceof THREE.Texture) return false;
  if (typeof color == 'string' && /\.[a-z]{2,}$/.test(color)) return false;
  return true;
}
class Myset<T> extends Set<T> {
  toggle(object: T) {
    if (this.has(object)) this.delete(object);
    else this.add(object);
    return true;
  }
}
export default class K3d extends THREE.EventDispatcher {
  domElement: HTMLElement;
  width: number;
  height: number;
  clock!: THREE.Clock;
  stats?: Stats;
  gui?: GUI;
  guiFolder: Record<string, any> = {};
  renderer!: THREE.WebGLRenderer;
  css2dRenderer!: CSS2DRenderer;
  css3dRenderer!: CSS3DRenderer;
  scene!: THREE.Scene;
  camera!: THREE.Camera;
  orthographicCamera?: THREE.OrthographicCamera;
  perspectiveCamera?: THREE.PerspectiveCamera;
  arrayCamera?: THREE.ArrayCamera;
  cubeCamera?: THREE.CubeCamera;
  stereoCamera?: THREE.StereoCamera;
  ambientLight?: THREE.AmbientLight;
  directionalLight?: THREE.DirectionalLight;
  hemisphereLight?: THREE.HemisphereLight;
  pointLight?: THREE.PointLight;
  rectAreaLight?: THREE.RectAreaLight;
  spotLight?: THREE.SpotLight;
  orbitControls!: OrbitControls;
  dragControls?: DragControls;
  firstPersonControls?: FirstPersonControls;
  flyControls?: FlyControls;
  pointerLockControls?: PointerLockControls;
  trackballControls?: TrackballControls;
  transformControls?: TransformControls;
  sky?: THREE.Texture;
  fog?: THREE.Fog;
  models?: THREE.Mesh[] = [];
  mixers: THREE.AnimationMixer[] = [];
  mixerActions: { [a: string]: THREE.AnimationAction[] } = {};
  renderScene!: RenderPass;
  effectComposer!: EffectComposer;
  finalComposer?: EffectComposer;
  unrealBloomPass?: UnrealBloomPass;
  bloomLayer?: THREE.Layers;
  outlinePass?: OutlinePass;
  clickObjects: Set<THREE.Mesh> = new Set();
  hoverObjects: Set<THREE.Mesh> = new Set();
  outlineObjects: Myset<THREE.Mesh> = new Myset();
  materials: { [key: string]: THREE.Material } = {};
  darkMaterials: { [key: string]: THREE.Material } = {};
  renderRequested: boolean = false;
  private _renderRequested: boolean = false;
  _onresize = () => this.onresize();
  onLoad?: (k3d: K3d) => void;
  onprogress?: (gltf: THREE.Mesh) => void;
  constructor(domElement?: HTMLElement | string, option?: boolean | k3dParam) {
    super();
    if (typeof option === 'boolean') {
      this.renderRequested = option;
      this._renderRequested = option;
    }
    this.domElement = this.getDomElement(domElement);
    this.width = this.domElement.clientWidth;
    this.height = this.domElement.clientHeight;
    this.clock = new THREE.Clock();
    if (!WebGL.isWebGLAvailable()) {
      const warning = WebGL.getWebGLErrorMessage();
      this.domElement.appendChild(warning);
      return;
    }
    if (option instanceof Object) this.init(option);
    window.addEventListener('resize', this._onresize);
  }

  async init(option) {
    if (_.has(option, 'renderRequested')) {
      this.renderRequested = !!option.renderRequested;
      this._renderRequested = !!option.renderRequested;
    }
    if (_.has(option, 'onprogress')) this.onprogress = option.onprogress;
    if (_.has(option, 'onLoad')) this.onLoad = option.onLoad;
    if (option.stats) this.addStats();
    this.addScene(option.scene);
    if (option.render) this.addRenderer(option.render);
    if (option.perspectiveCamera) this.addPerspectiveCamera(option.perspectiveCamera);
    if (option.orthographicCamera) this.addOrthographicCamera(option.orthographicCamera);
    if (option.controls) await this.addOrbitControls(option.controls);
    if (option.ambientLight) this.addAmbientLight(option.ambientLight);
    if (option.directionalLight) this.addDirectionalLight(option.directionalLight);
    if (option.hemisphereLight) this.addHemisphereLight(option.hemisphereLight);
    if (option.sky) await this.addSky(option.sky);
    if (option.shadow) this.addShadow(option.shadow);
    if (option.fog) this.addFog(option.fog);
    if (option.filter) await this.addBSC(option.filter);
    if (option.dof) await this.addDof(option.dof);
    if (option.outline) await this.addOutLine(option.outline);
    if (option.bloom) await this.initBloom(option.bloom);
    if (option.models && option.models.length > 0) this.modelLoads(option.models);
    else {
      this.onLoad(this);
    }
    if (!this.renderRequested) this.animate();
  }
  /**
   *  获取场景父级元素
   * @param domElement
   */
  getDomElement(domElement: string | HTMLElement): HTMLElement {
    let dom: HTMLElement;
    if (domElement) dom = typeof domElement === 'string' ? document.querySelector(domElement) : domElement;
    if (!dom) {
      dom = document.body;
      dom.style.width = '100%';
      dom.style.height = '100vh';
    }
    return dom;
  }
  /**
   * 添加渲染器，在控制器添加前添加渲染器
   * @param option {@link k3d.WebGLRendererParameters}
   * @returns THREE.WebGLRenderer
   */
  addRenderer(option: k3d.WebGLRendererParameters = {}): THREE.WebGLRenderer {
    const configs = [
      'autoClear',
      'autoClearColor',
      'autoClearDepth',
      'autoClearStencil',
      'outputColorSpace',
      'localClippingEnabled',
      'clippingPlanes',
      'useLegacyLights',
      'sortObjects',
      'toneMapping',
      'toneMappingExposure',
    ];
    const renderer = new THREE.WebGLRenderer(_.omit(option, [...configs, 'gui']));
    // 设置this.reader分辨率
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width | 0, this.height | 0);
    this.domElement.appendChild(renderer.domElement);
    // 设置配置项
    for (let key in _.pick(option, configs)) {
      if (_.has(renderer, key)) renderer[key] = option[key];
    }
    if (option.gui) {
      if (!this.gui) this.initGui();
      const rendererGui = this.gui.addFolder('renderer');
      if (!option.toneMappingExposure) option.toneMappingExposure = 1;
      rendererGui
        .add(option, 'toneMappingExposure')
        .step(0.001)
        .onChange((value) => {
          renderer.toneMappingExposure = value;
        });
    }
    this.renderer = renderer;
    return renderer;
  }

  /**
   * 添加css2d渲染器，在控制器添加前添加渲染器
   */
  async addCSS2DRenderer() {
    const { CSS2DRenderer } = await import('three/examples/jsm/renderers/CSS2DRenderer.js');
    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(this.width, this.height);
    this.css2dRenderer.domElement.style.position = 'absolute';
    this.css2dRenderer.domElement.style.top = '0px';
    this.css2dRenderer.domElement.style.margin = '0';
    this.domElement.appendChild(this.css2dRenderer.domElement);
  }
  /**
   * 创建css3d渲染器，在控制器添加前添加渲染器
   */
  async addCSS3DRenderer() {
    const { CSS3DRenderer } = await import('three/examples/jsm/renderers/CSS3DRenderer.js');
    this.css3dRenderer = new CSS3DRenderer();
    this.css3dRenderer.setSize(this.width, this.height);
    this.css3dRenderer.domElement.style.position = 'absolute';
    this.css3dRenderer.domElement.style.top = '0px';
    this.css3dRenderer.domElement.style.zIndex = '2';
    this.css3dRenderer.domElement.style.margin = '0';
    this.domElement.appendChild(this.css3dRenderer.domElement);
  }

  /**
   * 创建css2d面板
   * @param option
   * @returns Promise<CSS2DObject>
   */
  async addCss2dPlane(option: {
    html: string;
    target?: THREE.Group;
    position?: k3d.numberArray3;
    center?: [number, number];
    className?: string;
  }): Promise<CSS2DObject> {
    if (!this.css2dRenderer) await this.addCSS2DRenderer();
    const { html, target = this.scene, position = [0, 0, 0], center = [0, 0], className = 'k3d-plane' } = option;
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = html;
    const { CSS2DObject } = await import('three/examples/jsm/renderers/CSS2DRenderer.js');
    const css2dLabel = new CSS2DObject(div);
    css2dLabel.position.set(...position);
    (css2dLabel as Record<any, any>).center.set(...center);
    target.add(css2dLabel);
    return css2dLabel;
  }
  /**
   * 创建css3d面板
   * @param option
   * @returns Promise<CSS3DObject>
   */
  async addCss3dPlane(option: {
    html: string;
    target?: THREE.Group;
    position?: k3d.numberArray3;
    className?: string;
    scale?: k3d.numberArray3;
    rotation?: k3d.numberArray3;
  }): Promise<CSS3DObject> {
    if (!this.css2dRenderer) await this.addCSS3DRenderer();
    const { html, target = this.scene, position = [0, 0, 0], className = 'k3d-plane', scale = [1, 1, 1] } = option;
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = html;
    const { CSS3DObject } = await import('three/examples/jsm/renderers/CSS3DRenderer.js');
    const css3dLabel = new CSS3DObject(div);
    css3dLabel.position.set(...position);
    css3dLabel.scale.set(...scale);
    target.add(css3dLabel);
    return css3dLabel;
  }
  /**
   * 添加场景
   * @param option {@link k3d.SceneParameters}
   * @returns THREE.Scene
   */
  addScene(option: k3d.SceneParameters = {}): THREE.Scene {
    const scene = new THREE.Scene();
    if (option.background) {
      if (isColor(option.background)) {
        // 场景背景是颜色时
        scene.background = new THREE.Color(option.background as k3d.color);
      } else {
        if (option.background instanceof THREE.Texture) scene.background = option.background;
        // 场景背景是图片时，如果时天空盒，使用sky实现
        else
          textureLoader(option.background as string).then((texture) => {
            scene.background = texture;
          });
      }
    }
    this.scene = scene;
    if (option.gui) this.addGui(scene, ['background', 'backgroundBlurriness']);
    return scene;
  }
  /**
   * 添加正交相机
   * @param option {@link k3d.OrthographicCameraParameters}
   * @returns THREE.OrthographicCamera
   */
  addOrthographicCamera(option: k3d.OrthographicCameraParameters = {}): THREE.OrthographicCamera {
    let { offset = 2, near = 1, far = 1000, position = [0, 0, 0], target = [0, 0, 0] } = option;
    let camera = new THREE.OrthographicCamera(
      this.width / -offset,
      this.width / offset,
      this.height / offset,
      this.height / -offset,
      near,
      far
    );
    camera.position.set(...position);
    let targetVc3 = new THREE.Vector3(...target);
    camera.lookAt(targetVc3);
    camera.updateProjectionMatrix();
    if (!this.camera) this.camera = camera;
    if (option.gui) {
      let cameraGui = this.addGui(camera, ['near', 'far', 'position']);
      if (!option.offset) option.offset = 2;
      cameraGui
        .add(option, 'offset')
        .step(0.01)
        .onChange((val) => {
          camera.left = this.width / -val;
          camera.right = this.width / val;
          camera.top = this.height / val;
          camera.bottom = this.height / -val;
        });
      cameraGui.add(targetVc3, 'x').name('targetX').step(0.01);
      cameraGui.add(targetVc3, 'y').name('targetY').step(0.01);
      cameraGui.add(targetVc3, 'z').name('targetZ').step(0.01);
    }
    this.orthographicCamera = camera;
    return camera;
  }
  /**
   * 添加透视相机
   * @param option {@link k3d.PerspectiveCameraParameters}
   * @returns THREE.PerspectiveCamera
   */
  addPerspectiveCamera(option: k3d.PerspectiveCameraParameters = {}): THREE.PerspectiveCamera {
    let {
      fov = 50,
      aspect = this.width / this.height,
      near = 1,
      far = 1000,
      position = [0, 0, 0],
      target = [0, 0, 0],
    } = option;
    let camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(...position);
    let targetVc3 = new THREE.Vector3(...target);
    camera.lookAt(targetVc3);
    this.perspectiveCamera = camera;
    if (option.gui) {
      let cameraGui = this.addGui(camera, ['fov', 'near', 'far', 'position']);
      cameraGui.add(targetVc3, 'x').name('targetX').step(0.01);
      cameraGui.add(targetVc3, 'y').name('targetY').step(0.01);
      cameraGui.add(targetVc3, 'z').name('targetZ').step(0.01);
    }
    camera.updateProjectionMatrix();
    if (!this.camera) this.camera = camera;
    return camera;
  }
  /**
   * 添加一组相机
   * @param cameras 相机组
   * @returns THREE.ArrayCamera
   */
  addArrayCamera(cameras?: THREE.PerspectiveCamera[]): THREE.ArrayCamera {
    let camera = new THREE.ArrayCamera(cameras);
    this.arrayCamera = camera;
    return camera;
  }
  /**
   * 添加立方相机
   * @param option {@link k3d.CubeCameraParameters}
   * @returns THREE.CubeCamera
   */
  addCubeCamera(option: k3d.CubeCameraParameters = {}): THREE.CubeCamera {
    let { near = 1, far = 1000, renderTarget } = option;
    let camera = new THREE.CubeCamera(near, far, renderTarget);
    this.cubeCamera = camera;
    if (option.gui) this.addGui(camera, ['near', 'far']);
    return camera;
  }
  /**
   * 添加立体相机
   * @returns THREE.StereoCamera
   */
  addStereoCamera(): THREE.StereoCamera {
    let camera = new THREE.StereoCamera();
    this.stereoCamera = camera;
    return camera;
  }
  /**
   * 检查是否控制器条件，并返回渲染器
   * @returns
   */
  controlsCondition() {
    let renderer = this.css3dRenderer || this.css2dRenderer || this.renderer;
    if (!renderer) throw new Error('请先添加渲染器');
    if (!this.camera) throw new Error('请先设置主视角相机camera');
    return renderer;
  }
  /**
   * 添加拖拽控制器
   * @param option
   * @returns Promise<DragControls>
   */
  async addDragControls(option: {
    enabled?: boolean;
    transformGroup?: boolean;
    objects: THREE.Object3D<THREE.Event>[];
    gui?: boolean;
  }): Promise<DragControls> {
    let renderer = this.controlsCondition();
    const { DragControls } = await import('three/examples/jsm/controls/DragControls.js');
    let controls = new DragControls(option.objects, this.camera, renderer.domElement);
    if (option.enabled) controls.enabled = option.enabled;
    if (option.enabled) controls.transformGroup = option.transformGroup;
    this.dragControls = controls;
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    if (option.gui) this.addGui(controls, ['enabled', 'transformGroup']);
    return controls;
  }
  /**
   * 添加轨道控制器
   * @param option {@link k3d.ControlsParameters}
   * @returns Promise<OrbitControls>
   */
  async addOrbitControls(option: k3d.ControlsParameters = {}): Promise<OrbitControls> {
    let renderer = this.controlsCondition();
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    let controls = new OrbitControls(this.camera, renderer.domElement);
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        if (key == 'target') controls[key].set(...option[key]);
        else controls[key] = option[key];
      }
    }
    this.orbitControls = controls;
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    if (option.gui) {
      let guiOption = [
        'autoRotate',
        'autoRotateSpeed',
        'enableDamping',
        'dampingFactor',
        'enabled',
        'enablePan',
        'screenSpacePanning',
        'panSpeed',
        'enableRotate',
        'rotateSpeed',
        'enableZoom',
        'zoomSpeed',
        { name: 'maxAzimuthAngle', max: 2 * Math.PI, min: -2 * Math.PI },
        { name: 'minAzimuthAngle', max: 2 * Math.PI, min: -2 * Math.PI },
        { name: 'maxPolarAngle', max: 2 * Math.PI, min: 0 },
        { name: 'minPolarAngle', max: 2 * Math.PI, min: 0 },
        { name: 'minAzimuthAngle', max: 2 * Math.PI, min: -2 * Math.PI },
      ];
      if ((this.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        guiOption.push('maxDistance', 'minDistance');
      }
      if ((this.camera as THREE.OrthographicCamera).isOrthographicCamera) {
        guiOption.push('maxZoom', 'minZoom');
      }
      this.addGui(controls, guiOption);
    }
    return controls;
  }
  /**
   * 添加第一人称控制器
   * @param option
   * @returns Promise<FirstPersonControls>
   */
  async addFirstPersonControls(
    option: {
      activeLook?: boolean;
      autoForward?: boolean;
      constrainVertical?: boolean;
      enabled?: boolean;
      heightCoef?: number;
      heightMax?: number;
      heightMin?: number;
      heightSpeed?: number;
      lookVertical?: boolean;
      lookSpeed?: boolean;
      mouseDragOn?: boolean;
      movementSpeed?: number;
      verticalMax?: number;
      verticalMin?: number;
      gui?: boolean;
    } = {}
  ): Promise<FirstPersonControls> {
    let renderer = this.controlsCondition();
    const { FirstPersonControls } = await import('three/examples/jsm/controls/FirstPersonControls.js');
    let controls = new FirstPersonControls(this.camera, renderer.domElement);
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        controls[key] = option[key];
      }
    }
    this.firstPersonControls = controls;
    if (this.renderRequested) this.renderRequested = true;
    if (option.gui)
      this.addGui(controls, [
        'activeLook',
        'autoForward',
        'constrainVertical',
        'enabled',
        'heightCoef',
        'heightMax',
        'heightMin',
        'heightSpeed',
        'lookVertical',
        'lookSpeed',
        'mouseDragOn',
        'movementSpeed',
        { name: 'verticalMax', max: Math.PI, min: 0 },
        { name: 'verticalMin', max: Math.PI, min: 0 },
      ]);
    return controls;
  }
  /**
   * 添加飞行控制器
   * @param option
   * @returns Promise<FlyControls>
   */
  async addFlyControls(
    option: {
      autoForward?: boolean;
      dragToLook?: boolean;
      movementSpeed?: number;
      rollSpeed?: number;
      gui?: boolean;
    } = {}
  ): Promise<FlyControls> {
    let renderer = this.controlsCondition();
    const { FlyControls } = await import('three/examples/jsm/controls/FlyControls.js');
    let controls = new FlyControls(this.camera, renderer.domElement);
    this.flyControls = controls;
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        controls[key] = option[key];
      }
    }
    if (option.gui) this.addGui(controls, ['autoForward', 'dragToLook', 'movementSpeed', 'rollSpeed']);
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    return controls;
  }
  /**
   * 添加指针锁定控制器
   * @param option
   * @returns Promise<PointerLockControls>
   */
  async addPointerLockControls(
    option: { isLocked?: boolean; maxPolarAngle?: number; minPolarAngle?: number; gui?: boolean } = {}
  ): Promise<PointerLockControls> {
    let renderer = this.controlsCondition();
    const { PointerLockControls } = await import('three/examples/jsm/controls/PointerLockControls.js');
    let controls = new PointerLockControls(this.camera, renderer.domElement);
    this.pointerLockControls = controls;
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        controls[key] = option[key];
      }
    }
    if (option.gui)
      this.addGui(controls, [
        'isLocked',
        { name: 'maxPolarAngle', max: Math.PI, min: 0 },
        { name: 'minPolarAngle', max: Math.PI, min: 0 },
      ]);
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    return controls;
  }
  /**
   * 添加轨迹球控制器
   * @param option
   * @returns Promise<TrackballControls>
   */
  async addTrackballControls(
    option: {
      enabled?: boolean;
      noPan?: boolean;
      noRotate?: boolean;
      noZoom?: boolean;
      panSpeed?: number;
      rotateSpeed?: number;
      zoomSpeed?: number;
      maxDistance?: number;
      minDistance?: number;
      maxZoom?: number;
      minZoom?: number;
      staticMoving?: boolean;
      dynamicDampingFactor?: number;
      gui?: boolean;
    } = {}
  ): Promise<TrackballControls> {
    let renderer = this.controlsCondition();
    const { TrackballControls } = await import('three/examples/jsm/controls/TrackballControls.js');
    let controls = new TrackballControls(this.camera, renderer.domElement);
    this.trackballControls = controls;
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        controls[key] = option[key];
      }
    }

    if (option.gui) {
      let guiOption = [
        'enabled',
        'noPan',
        'noRotate',
        'noZoom',
        'panSpeed',
        'rotateSpeed',
        'zoomSpeed',
        'staticMoving',
        'dynamicDampingFactor',
      ];
      if ((this.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        guiOption.push('maxDistance', 'minDistance');
      }
      if ((this.camera as THREE.OrthographicCamera).isOrthographicCamera) {
        guiOption.push('maxZoom', 'minZoom');
      }
      this.addGui(controls, guiOption);
    }
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    return controls;
  }
  /**
   * 添加变换控制器
   * @param option
   * @returns Promise<TransformControls>
   */
  async addTransformControls(
    option: {
      axis?: string;
      enabled?: boolean;
      mode?: 'translate' | 'rotate' | 'scale';
      rotationSnap?: number;
      showX?: boolean;
      showY?: boolean;
      showZ?: boolean;
      size?: number;
      translationSnap?: number;
      space?: 'world' | 'local';
      gui?: boolean;
    } = {}
  ): Promise<TransformControls> {
    let renderer = this.controlsCondition();
    const { TransformControls } = await import('three/examples/jsm/controls/TransformControls.js');
    let controls = new TransformControls(this.camera, renderer.domElement);
    this.transformControls = controls;
    for (const key in option) {
      if (_.has(controls, key) && _.has(option, key)) {
        controls[key] = option[key];
      }
    }
    if (option.gui) {
      let controlsGui = this.addGui(controls, [
        'axis',
        'enabled',
        'rotationSnap',
        'showX',
        'showY',
        'showZ',
        'size',
        'translationSnap',
      ]);
      controlsGui.add(controls, 'mode', ['translate', 'rotate', 'scale']);
      controlsGui.add(controls, 'space', ['world', 'local']);
    }
    controls.addEventListener('change', () => this.renderRequested && this.renderTimer());
    return controls;
  }
  /**
   * 添加环境光
   * @param option
   * @returns THREE.AmbientLight
   */
  addAmbientLight(option: { color?: k3d.color; intensity?: number; gui?: boolean } = {}): THREE.AmbientLight {
    const light = new THREE.AmbientLight(option.color, option.intensity);
    this.ambientLight = light;
    this.scene.add(light);
    if (option.gui) this.addGui(light, ['color', 'intensity']);
    return light;
  }
  /**
   * 添加平行光
   * @param option {@link k3d.DirectionalLightParameters}
   * @returns THREE.DirectionalLight
   */
  addDirectionalLight(option: k3d.DirectionalLightParameters = {}): THREE.DirectionalLight {
    let { color, intensity, position, target } = option;
    const light = new THREE.DirectionalLight(color, intensity);
    this.directionalLight = light;
    if (position) light.position.set(...position);
    if (target) {
      const targetObject = new THREE.Object3D();
      this.scene.add(targetObject);
      targetObject.position.set(...target);
      light.target = targetObject;
    }
    if (option.gui) this.addGui(light, ['color', 'intensity', 'position', 'target']);
    this.scene.add(light);
    return light;
  }
  /**
   * 添加半球光
   * @param option {@link k3d.HemisphereLightParameters}
   * @returns THREE.HemisphereLight
   */
  addHemisphereLight(option: k3d.HemisphereLightParameters = {}): THREE.HemisphereLight {
    let { color, intensity, groundColor, position } = option;
    const light = new THREE.HemisphereLight(color, groundColor, intensity);
    if (position) light.position.set(...position);
    this.hemisphereLight = light;
    if (option.gui) this.addGui(light, ['color', 'intensity', 'position', 'groundColor']);
    this.scene.add(light);
    return light;
  }
  /**
   * 添加点光源
   * @param option {@link k3d.HemisphereLight}
   * @returns THREE.PointLight
   */
  addPointLight(option: k3d.PointLightParameters = {}): THREE.PointLight {
    let { color, intensity, distance, decay, position } = option;
    const light = new THREE.PointLight(color, intensity, distance, decay);
    if (position) light.position.set(...position);
    this.pointLight = light;
    if (option.gui) this.addGui(light, ['color', 'intensity', 'position', 'distance', 'decay']);
    this.scene.add(light);
    return light;
  }
  /**
   * 添加平面光光源
   * @param option {@link k3d.RectAreaLightParameters}
   * @returns THREE.RectAreaLight
   */
  addRectAreaLight(option: k3d.RectAreaLightParameters = {}): THREE.RectAreaLight {
    let { color, intensity, width, height, position } = option;
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    if (position) light.position.set(...position);
    this.rectAreaLight = light;
    if (option.gui) this.addGui(light, ['color', 'intensity', 'position', 'width', 'height']);
    this.scene.add(light);
    return light;
  }
  /**
   * 添加聚光灯
   * @param option {@link k3d.SpotLightParameters}
   * @returns THREE.SpotLight
   */
  addSpotLight(option: k3d.SpotLightParameters = {}): THREE.SpotLight {
    let { color, intensity, distance, angle, penumbra, decay, position, target } = option;
    const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    if (position) light.position.set(...position);
    if (target) {
      const targetObject = new THREE.Object3D();
      this.scene.add(targetObject);
      targetObject.position.set(...target);
      light.target = targetObject;
    }
    this.spotLight = light;
    if (option.gui)
      this.addGui(light, ['color', 'intensity', 'angle', 'distance', 'penumbra', 'decay', 'position', 'target']);
    this.scene.add(light);
    return light;
  }

  /**
   * 创建天空盒
   * @param urls string | string[]
   * @returns THREE.Texture
   */
  async addSky(urls: string | string[]): Promise<THREE.Texture> {
    if (typeof urls == 'string' || urls.length == 1) {
      let url = typeof urls == 'string' ? urls : urls[0];
      const texture = await textureLoader(url);
      const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
      rt.fromEquirectangularTexture(this.renderer, texture);
      this.scene.background = rt.texture;
      this.sky = rt.texture;
      return rt.texture;
    } else {
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load(urls);
      this.scene.background = texture;
      this.sky = texture;
      return texture;
    }
  }
  /**
   * 添加雾
   * @param THREE.Fog {@link k3d.FogParameters}
   * @returns THREE.Fog
   */
  addFog(option: k3d.FogParameters = {}): THREE.Fog {
    let param = {
      color: '#ffffff',
      near: 1,
      far: 1000,
    };
    option = Object.assign(param, option);
    const fog = new THREE.Fog(option.color, option.near, option.far);
    if (option.gui) this.addGui(fog, ['color', 'near', 'far']);
    this.scene.fog = fog;
    return fog;
  }
  /**
   * 添加雾-指数
   * @param option
   * @returns THREE.FogExp2
   */
  addFogExp2(option: { color: k3d.color; density: number; gui?: boolean }): THREE.FogExp2 {
    const fog = new THREE.FogExp2(option.color, option.density);
    if (option.gui) this.addGui(fog, ['color', 'density']);
    this.scene.fog = fog;
    return fog;
  }

  /**
   * 创建阴影
   * @param option {@link k3d.ShadowParameters}
   */
  addShadow(option: k3d.ShadowParameters = {}) {
    // 默认参数
    let defaultOption = {
      size: 512,
      near: 1,
      far: 1000,
      offset: 2,
      focus: 1,
    };
    option = Object.assign(defaultOption, option);
    // 开启渲染器阴影贴图
    this.renderer.shadowMap.enabled = true;
    // 开启物体投射阴影
    if (this.models.length > 0) {
      this.models.forEach((model) => {
        model.traverse((child: THREE.Mesh) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      });
    }
    // 设置参数
    let setOption = (light) => {
      light.castShadow = true;
      light.shadow.mapSize.width = option.size;
      light.shadow.mapSize.height = option.size;
      light.shadow.camera.near = option.near;
      light.shadow.camera.far = option.far;
      if (light.isDirectionalLight) {
        this.directionalLight.shadow.camera.top = option.offset;
        this.directionalLight.shadow.camera.bottom = -option.offset;
        this.directionalLight.shadow.camera.left = -option.offset;
        this.directionalLight.shadow.camera.right = option.offset;
      }
      if (light.isSpotLight) {
        this.spotLight.shadow.focus = option.focus;
      }
    };
    // 开启图形化控制
    if (option.gui) {
      if (!this.gui) this.initGui();
      let shadowGui = this.gui.addFolder('shadow');
      shadowGui.onChange(() => {
        if (this.directionalLight) setOption(this.directionalLight);
        if (this.pointLight) setOption(this.pointLight);
        if (this.spotLight) setOption(this.spotLight);
      });
      shadowGui.add(option, 'size');
      shadowGui.add(option, 'near').step(0.01);
      shadowGui.add(option, 'far').step(0.01);
      if (this.directionalLight) shadowGui.add(option, 'offset').step(0.01);
      if (this.spotLight) shadowGui.add(option, 'focus', 0, 1).step(0.01);
    }
    if (this.directionalLight) setOption(this.directionalLight);
    if (this.pointLight) setOption(this.pointLight);
    if (this.spotLight) setOption(this.spotLight);
  }
  /**
   * 模型加载
   * @param url
   * @returns
   */
  modelLoad(url: string): Promise<THREE.Mesh> {
    return new Promise((reslove, reject) => {
      try {
        modeLoader(url, (mode, mixer, mixerActions) => {
          if (mixer) this.mixers.push(mixer);
          if (mixerActions) this.mixerActions[mode.name] = mixerActions;
          this.scene.add(mode);
          mode.traverse((child: any) => {
            if (child.isMesh && this.renderer?.shadowMap?.enabled) {
              child.castShadow = true;
              child.receiveShadow = false;
            }
          });
          this.models.push(mode);
          reslove(mode);
          if (this.renderRequested) this.renderTimer();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 加载模型
   */
  private modelLoads(urls: string | string[]) {
    const load = async (url: string) => {
      let mode: THREE.Mesh = await this.modelLoad(url);
      if (typeof this.onprogress === 'function') this.onprogress(mode);
    };
    if (typeof urls == 'string') {
      load(urls).then(() => {
        if (typeof this.onLoad === 'function') this.onLoad(this);
      });
    } else {
      let loads = [];
      for (const iterator of urls) {
        loads.push(load(iterator));
      }
      Promise.all(loads).then(() => {
        if (typeof this.onLoad === 'function') this.onLoad(this);
      });
    }
  }
  /**
   * 渲染通道
   */
  private async addRenderPass() {
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    this.renderScene = new RenderPass(this.scene, this.camera);
  }
  /**
   * 后期
   */
  private async addComposer() {
    if (!this.renderScene) this.addRenderPass();
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    this.effectComposer = new EffectComposer(this.renderer);
    this.effectComposer.setPixelRatio(window.devicePixelRatio);
    this.effectComposer.setSize(this.width, this.height);
    this.effectComposer.addPass(this.renderScene);
  }
  /**
   * 滤镜
   * @param option {@link k3d.FilterParameters}
   * @returns Promise<ShaderPass>
   */
  async addBSC(option: k3d.FilterParameters): Promise<ShaderPass> {
    if (!this.effectComposer) this.addComposer();
    const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const BSCShader = {
      uniforms: {
        tDiffuse: { value: null },
        _Brightness: { value: 1 },
        _Saturation: { value: 1 },
        _Contrast: { value: 1 },
      },

      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float _Brightness;
        uniform float _Saturation;
        uniform float _Contrast;
        varying vec2 vUv;
        vec3 lerpColor(vec3 col1,vec3 col2, float value){
          vec3 newCol = vec3 ((col1.r * (1.0 - value) + col2.r * value), (col1.g * (1.0 - value) + col2.g * value), (col1.b * (1.0 - value) + col2.b * value));
          return newCol;
        }
        float mylerp(float a,float b, float value){
          return (a * (1.0 - value) + b * value);
        }
        void main() {
          // 获取原图的颜色rgba
          vec4 color = texture2D(tDiffuse, vUv);
          //brigtness亮度直接乘以一个系数，也就是RGB整体缩放，调整亮度
          vec3 finalColor = color.rgb * _Brightness;
          //saturation饱和度：首先根据公式计算同等亮度情况下饱和度最低的值：
          float gray = 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b;
          vec3 grayColor = vec3(gray, gray, gray);
          //根据Saturation在饱和度最低的图像和原图之间差值
          finalColor = lerpColor(grayColor, finalColor, _Saturation);
          //contrast对比度：首先计算对比度最低的值
          vec3 avgColor = vec3(0.5, 0.5, 0.5);
          //根据Contrast在对比度最低的图像和原图之间差值
          finalColor = lerpColor(avgColor, finalColor, _Contrast);
          // 结果rgb,透明度保持原值即可
          gl_FragColor = vec4(vec3(finalColor), color.a);
        }`,
    };
    // 添加 RGB 颜色分离效果通道效果
    let effect = new ShaderPass(BSCShader);
    // effect.uniforms[ '_Brightness' ].value = 0.015;
    effect.uniforms['_Brightness'].value = option.brightness;
    effect.uniforms['_Saturation'].value = option.saturation;
    effect.uniforms['_Contrast'].value = option.contrast;
    if (option.gui) {
      if (!this.gui) this.initGui();
      let bscgui = this.gui.addFolder('filter');
      bscgui
        .add(option, 'brightness', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Brightness'].value = value;
        });
      bscgui
        .add(option, 'saturation', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Saturation'].value = value;
        });
      bscgui
        .add(option, 'contrast', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Contrast'].value = value;
        });
    }
    this.effectComposer.addPass(effect);
    return effect;
  }
  /**
   * 创建辉光
   * @param option {@link k3d.BloomParameters}
   * @returns Promise<UnrealBloomPass>
   */
  async initBloom(option: k3d.BloomParameters): Promise<UnrealBloomPass> {
    if (!this.effectComposer) await this.addComposer();
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(option.width || this.width, option.height || this.height),
      option.strength,
      option.radius,
      option.threshold
    );
    this.effectComposer.addPass(unrealBloomPass);
    this.unrealBloomPass = unrealBloomPass;
    if (option.gui) this.addGui(unrealBloomPass, ['strength', 'radius', 'threshold']);
    return unrealBloomPass;
  }
  /**
   * 添加辉光物体
   */
  addBloom(object: THREE.Object3D<THREE.Event>) {
    if (!this.unrealBloomPass) throw new Error('请先执行initBloom方法');
    if (!this.finalComposer) this.addFinalComposer();
    object.layers.enable(BLOOM_SCENE);
    if (this.renderRequested) this.renderTimer();
  }
  /**
   * 切换添加辉光物体
   */
  toggleBloom(object: THREE.Object3D<THREE.Event>) {
    object.layers.toggle(BLOOM_SCENE);
    if (this.renderRequested) this.renderTimer();
  }
  /**
   * 创建部分辉光正常渲染的后期
   * @returns Promise<ShaderPass>
   */
  private async addFinalComposer(): Promise<ShaderPass> {
    // 产生辉光的后期
    if (!this.effectComposer) this.addComposer();
    // 产生辉光的后期不渲染到屏幕
    this.effectComposer.renderToScreen = false;
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(BLOOM_SCENE);
    const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.effectComposer.renderTarget2.texture },
        },
        vertexShader: `
        varying vec2 vUv;

        void main() {
  
          vUv = uv;
  
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
        }`,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;

          varying vec2 vUv;

          void main() {

            gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

			  }`,
        defines: {},
      }),
      'baseTexture'
    );
    finalPass.needsSwap = true;
    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.setPixelRatio(window.devicePixelRatio);
    this.finalComposer.setSize(this.width, this.height);
    this.finalComposer.addPass(this.renderScene);
    this.finalComposer.addPass(finalPass);
    return finalPass;
  }

  /**
   * 创建景深
   * @param option {@link k3d.DofParameter}
   * @returns Promise<BokehPass>
   */
  async addDof(option: k3d.DofParameter = {}): Promise<BokehPass> {
    if (!this.effectComposer) this.addComposer();
    const { BokehPass } = await import('three/examples/jsm/postprocessing/BokehPass.js');
    const bokehPass = new BokehPass(this.scene, this.camera, {
      focus: option.focus || 1.0,
      aperture: option.aperture || 0.025,
      maxblur: option.maxblur || 0.01,
    });
    if (option.gui) this.addGui(bokehPass, ['focus', 'aperture', 'maxblur']);
    this.effectComposer.addPass(bokehPass);
    return bokehPass;
  }
  /**
   * 描边效果
   * @param option {@link k3d.OutLineParameters}
   * @returns Promise<OutlinePass>
   */
  async addOutLine(option: k3d.OutLineParameters = {}): Promise<OutlinePass> {
    if (!this.effectComposer) this.addComposer();
    const { OutlinePass } = await import('three/examples/jsm/postprocessing/OutlinePass.js');
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(this.width, this.height),
      this.scene,
      this.camera as THREE.Camera
    );
    /**
     * 重写this.outlineObjects 的add和delete方法
     */
    this.rewriteSet(this.outlineObjects, (set: Set<THREE.Mesh>) => {
      this.outlinePass.selectedObjects = Array.from(set);
    });
    for (const key in option) {
      if (_.has(option, key) && _.has(this.outlinePass, key)) {
        if (['visibleEdgeColor', 'hiddenEdgeColor'].includes(key))
          this.outlinePass[key].set(option[key]); // 设置显示的颜色
        else this.outlinePass[key] = option[key];
      }
    }
    if (option.gui)
      this.addGui(this.outlinePass, [
        'edgeStrength',
        'edgeGlow',
        'edgeThickness',
        'pulsePeriod',
        'visibleEdgeColor',
        'hiddenEdgeColor',
        'usePatternTexture',
      ]);
    this.effectComposer.addPass(this.outlinePass);
    return this.outlinePass;
  }
  // 重写Set的Add和delete方法
  private rewriteSet(set, func) {
    const add = set.add;
    const del = set.delete;
    set.add = function (object: THREE.Mesh): Set<THREE.Mesh> {
      let res = add.call(set, object);
      func(set);
      return res;
    };

    set.delete = function (object: THREE.Mesh): boolean {
      let res = del.call(set, object);
      func(set);
      return res;
    };
  }
  /**
   * 添加动画帧监控器
   * @returns Stats
   */
  addStats(): Stats {
    let stats = new Stats();
    this.domElement.appendChild(stats.dom);
    this.stats = stats;
    return stats;
  }
  /**
   * 添加gui
   */
  async initGui() {
    this.gui = new GUI();
    this.gui.onChange(() => this.renderRequested && this.renderTimer());
  }
  /**
   *  添加参数控制
   * @param object 被设置的对象
   * @param options 设置的参数
   */
  addGui(object: any, options: (string | { name: string; max: number; min: number })[]): GUI {
    if (!this.gui) this.initGui();
    let folder;
    let name = object.type;
    if (_.has(this.guiFolder, name)) folder = this.guiFolder[name];
    else folder = this.gui.addFolder(name);
    folder.onChange(() => {
      // 如果object是相机，变化就更新相机投影矩阵
      if (object.isCamera) object.updateProjectionMatrix();
    });
    options.forEach((item) => {
      if (typeof item === 'string') {
        if (_.has(object, item)) {
          if (/color/i.test(item) || item == 'background') {
            let obj = {
              color: object[item].getHex(),
            };
            folder.addColor(obj, 'color').onChange((val) => {
              object[item] = new THREE.Color(val);
            });
          } else if (item == 'position') {
            folder.add(object[item], 'x').name('positionX').step(0.01);
            folder.add(object[item], 'y').name('positionY').step(0.01);
            folder.add(object[item], 'z').name('positionZ').step(0.01);
          } else if (item == 'target') {
            let target = object[item];
            if (object.isLight) target = target.position;
            folder.add(target, 'x').name('targetX').step(0.01);
            folder.add(target, 'y').name('targetY').step(0.01);
            folder.add(target, 'z').name('targetZ').step(0.01);
          } else if (item == 'rotation') {
            folder.add(object[item], 'x').name('rotationX').step(0.01);
            folder.add(object[item], 'y').name('rotationY').step(0.01);
            folder.add(object[item], 'z').name('rotationZ').step(0.01);
          } else if (item == 'scale') {
            folder.add(object[item], 'x').name('scaleX').step(0.01);
            folder.add(object[item], 'y').name('scaleY').step(0.01);
            folder.add(object[item], 'z').name('scaleZ').step(0.01);
          } else folder.add(object, item).step(0.01);
        } else {
          console.warn(name + '类型上不存在“' + item + '”属性');
        }
      } else if (_.has(object, item.name)) {
        folder.add(object, item.name, item.min, item.max).step(0.01);
      }
    });
    return folder;
  }
  /**
   * 点击拾取
   */
  bindEvent() {
    const render = this.css3dRenderer || this.css2dRenderer || this.renderer;
    // 模拟点击事件
    render.domElement.onmousedown = () => {
      // 当按下,绑定鼠标放开事件
      render.domElement.onmouseup = (event: MouseEvent) => {
        this.dispatchEvent({
          type: 'click',
          ...this.getSelectObject(event),
        });
        if (this.renderRequested) this.renderTimer();
      };
      // 当按下时间超过200ms,解绑鼠标放开事件
      let timer = setTimeout(() => {
        clearTimeout(timer);
        render.domElement.onmouseup = null;
      }, 200);
    };
    // 上一个hover物体
    let preObj;
    render.domElement.addEventListener(
      'pointermove',
      _.throttle((event) => {
        let mode = this.getSelectObject(event, 'move');
        // 当前没有选中物体和与上一个选中物体不一致时 置空上一个
        if (!mode || preObj !== mode.object) {
          // 当物体不在常亮描边数组中时，删除描边
          if (!this.outlineObjects.has(preObj) && this.outlinePass)
            this.outlinePass.selectedObjects = this.outlinePass.selectedObjects.filter((item) => item !== preObj);
          preObj = null;
          // 当选中有物体时，添加描边
          if (mode) {
            preObj = mode.object;
            // 当物体不在常亮描边数组中时，添加描边
            if (!this.outlineObjects.has(preObj)) this.outlinePass.selectedObjects.push(preObj);
          }
        }
        this.dispatchEvent({
          type: 'hover',
          ...mode,
        });

        if (this.renderRequested) this.renderTimer();
      }, 150)
    );
  }

  /**
   * 鼠标选取对象
   * @param event
   * @param type
   * @returns THREE.Intersection<THREE.Object3D<THREE.Event>>
   */
  getSelectObject(event: MouseEvent, type = 'click'): THREE.Intersection<THREE.Object3D<THREE.Event>> {
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    // 计算鼠标在元素的位置，由鼠标对于窗口位置减去元素位置
    let x = event.clientX - (event.target as HTMLElement).offsetLeft;
    let y = event.clientY - (event.target as HTMLElement).offsetTop;
    pointer.x = (x / this.width) * 2 - 1;
    pointer.y = -(y / this.height) * 2 + 1;
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(pointer, this.camera as THREE.Camera);
    // 计算物体和射线的焦点
    const intersects = raycaster.intersectObjects(
      type == 'click' ? Array.from(this.clickObjects) : Array.from(this.hoverObjects)
    );
    return intersects[0];
  }
  /**
   * 浏览器窗口变化执行
   */
  onresize() {
    this.width = this.domElement.clientWidth || window.innerWidth;
    this.height = this.domElement.clientHeight || window.innerHeight;
    if (this.orthographicCamera) {
      this.orthographicCamera.left = this.width / -2;
      this.orthographicCamera.right = this.width / 2;
      this.orthographicCamera.top = this.height / 2;
      this.orthographicCamera.bottom = this.height / -2;
      this.orthographicCamera.updateProjectionMatrix();
    }
    if (this.perspectiveCamera) {
      this.perspectiveCamera.aspect = this.width / this.height;
      this.perspectiveCamera.updateProjectionMatrix();
    }
    if (this.outlinePass) this.outlinePass.resolution = new THREE.Vector2(this.width, this.height);
    this.effectComposer && this.effectComposer.setSize(this.width, this.height);
    this.finalComposer && this.finalComposer.setSize(this.width, this.height);
    this.renderer.setSize(this.width, this.height);
    this.css2dRenderer && this.css2dRenderer.setSize(this.width, this.height);
    this.css3dRenderer && this.css3dRenderer.setSize(this.width, this.height);
    this.dispatchEvent({
      type: 'resize',
      width: this.width,
      height: this.height,
    });
  }
  // 截屏
  screenCapture() {
    this.renderer.render(this.scene, this.camera as THREE.Camera);
    const herf = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = Date.now() + '.png';
    a.href = herf;
    a.click();
  }

  outDescartes() {
    return {
      camera: this.camera.position,
      controls: this.orbitControls.target,
    };
  }

  /**
   * 限时开启动画帧
   */
  renderTimer = (function () {
    let renderTimeOut;
    return _.throttle(function () {
      if (renderTimeOut) clearTimeout(renderTimeOut);
      if (this._renderRequested) {
        this._renderRequested = false;
        this.animate();
      }
      renderTimeOut = setTimeout(() => {
        this._renderRequested = true;
      }, 3000);
    }, 2000);
  })();
  /**
   * 渲染函数
   */
  render() {
    this.dispatchEvent({ type: 'loop', clock: this.clock });
    if (this.stats) this.stats.update();
    const delta = this.clock.getDelta();
    if (this.orbitControls) this.orbitControls.update();
    if (this.firstPersonControls) this.firstPersonControls.update(delta);
    if (this.flyControls) this.flyControls.update(delta);
    if (this.trackballControls) this.trackballControls.update();
    // 如果有后期，刷新后期处理的渲染
    if (this.effectComposer) {
      // 如果有部分辉光
      if (this.finalComposer) this.bloomAnimate();
      else this.effectComposer.render(delta);
    } else this.renderer.render(this.scene, this.camera);
    this.css2dRenderer && this.css2dRenderer.render(this.scene, this.camera);
    this.css3dRenderer && this.css3dRenderer.render(this.scene, this.camera);
    for (const iterator of this.mixers) {
      iterator.update(delta);
    }
    TWEEN.update();
  }
  /**
   * 部分辉光执行
   */
  bloomAnimate() {
    // 1. 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
    this.scene.traverse((obj: THREE.Mesh) => {
      const material: THREE.Material = obj.material as THREE.Material;
      if (material && this.bloomLayer.test(obj.layers) === false) {
        this.materials[obj.uuid] = material;
        if (!this.darkMaterials[material.type]) {
          const Proto = Object.getPrototypeOf(material).constructor;
          this.darkMaterials[material.type] = new Proto({ color: 0x000000 });
        }
        obj.material = this.darkMaterials[material.type];
      }
    });
    // 2. 用 bloomComposer 产生辉光
    this.effectComposer.render();
    // 3. 将转成黑色材质的物体还原成初始材质
    this.scene.traverse((obj: THREE.Mesh) => {
      if (this.materials[obj.uuid]) {
        obj.material = this.materials[obj.uuid];
        delete this.materials[obj.uuid];
      }
    });
    // 4. 用 finalComposer 作最后渲染
    this.finalComposer.render();
  }
  /**
   * 动画帧
   * @param renderRequested 传false 关闭按需渲染
   */
  animate(renderRequested?: boolean) {
    if (renderRequested === false) {
      this.renderRequested = renderRequested;
      this._renderRequested = renderRequested;
    }
    if (!this._renderRequested) {
      this.render();
      requestAnimationFrame(() => this.animate());
    }
  }
  /**
   * 销毁
   */
  dispose() {
    this.domElement = null;
    window.removeEventListener('resize', this._onresize);
    this.renderRequested = false;
    this.scene.traverse((child: any) => {
      child.dispose && child.dispose();
    });
  }
}
