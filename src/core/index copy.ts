// ///<reference path = "../types/K3d.d.ts" />
// import * as THREE from 'three';
// import * as TWEEN from '@tweenjs/tween.js';
// import WebGL from './WebGL';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import Stats from 'three/examples/jsm/libs/stats.module.js';

// // 后期渲染关键库
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// import modeLoader from './modeLoader';
// import textureLoader from './textureLoader';

// import Events from './events';

// // GUI
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// import _ from 'lodash';
// // 判断是否是颜色
// function isColor(color): boolean {
//   if (color instanceof THREE.Texture) return false;
//   if (typeof color == 'string' && /\.[a-z]{2,}$/.test(color)) return false;
//   return true;
// }
// class Myset<T> extends Set<T> {
//   toggle(object: T) {
//     if (this.has(object)) this.delete(object);
//     else this.add(object);
//     return true;
//   }
// }
// export default class K3d extends Events {
//   /**
//    * 场景父元素
//    */
//   domElement!: HTMLElement;
//   width!: number;
//   height!: number;
//   clock!: THREE.Clock;
//   stats?: Stats;
//   gui?: GUI;
//   renderer!: THREE.WebGLRenderer;
//   css2dRenderer!: CSS2DRenderer;
//   css3dRenderer!: CSS3DRenderer;
//   scene!: THREE.Scene;
//   camera!: THREE.PerspectiveCamera | THREE.OrthographicCamera;
//   directionalLight?: THREE.DirectionalLight;
//   ambientLight?: THREE.AmbientLight;
//   hemisphereLight?: THREE.HemisphereLight;
//   controls!: OrbitControls;
//   sky?: THREE.Texture;
//   fog?: THREE.Fog;
//   BLOOM_SCENE = 1;
//   TWEEN = TWEEN;
//   mixers: THREE.AnimationMixer[] = [];
//   mixerActions: { [a: string]: THREE.AnimationAction[] } = {};
//   renderScene!: RenderPass;
//   effectComposer!: EffectComposer;
//   finalComposer?: EffectComposer;
//   bloomLayer?: THREE.Layers;
//   outlinePass?: OutlinePass;
//   clickObjects: Set<THREE.Mesh> = new Set();
//   hoverObjects: Set<THREE.Mesh> = new Set();
//   outlineObjects: Myset<THREE.Mesh> = new Myset();
//   materials: { [key: string]: THREE.Material } = {};
//   darkMaterials: { [key: string]: THREE.Material } = {};
//   modes: THREE.Mesh[] = [];
//   onLoad?: (k3d: K3d) => void;
//   onprogress?: (gltf: THREE.Mesh) => void;
//   _onresize = () => this.onresize();
//   private _renderRequested: boolean = true; // 缓存renderRequested的状态
//   /**
//    * 设置renderRequested为true 时 执行动画帧
//    */
//   set renderRequested(val) {
//     this._renderRequested = val;
//     if (val) this.animate();
//   }
//   get renderRequested() {
//     return this._renderRequested;
//   }
//   constructor(config: k3dParam) {
//     super();
//     this.domElement = this.getDomElement(config.domElement);
//     this.clock = new THREE.Clock();
//     if (config.stats) {
//       this.stats = new Stats();
//       this.domElement.append(this.stats.dom);
//     }
//     if (config.gui) {
//       this.gui = new GUI();
//       // 当gui发生变化时且未执行动画帧时 执行render
//       this.gui.onChange(() => !this.renderRequested && this.renderTimer());
//     }
//     this.renderer = this.initRenderer(config.render);
//     this.scene = this.initScene(config.scene);
//     // 添加天空盒
//     if (config.sky) this.initSky(config.sky);
//     if (config.fog) this.fog = this.initFog(config.fog);
//     this.camera = this.initCamera(config.camera);
//     if (config.light) this.initLight(config.light);
//     this.controls = this.initControls(config.controls);

//     if (config.filter) this.initBSC(config.filter);
//     if (config.bloom) this.initBloom(config.bloom);
//     // 景深一定放在辉光后面
//     if (config.dof) this.initDof(config.dof);
//     if (config.outline) this.initOutLine(config.outline);
//     if (config.onLoad) this.onLoad = config.onLoad;
//     if (config.onprogress) this.onprogress = config.onprogress;
//     if (_.has(config, 'renderRequested')) this.renderRequested = !!config.renderRequested;
//     if (config.models) this.modelLoads(config.models);
//     // 此处使用异步方法执行onLoad
//     else
//       Promise.resolve().then(() => {
//         if (!this.renderRequested) this.renderTimer();
//         else this.animate();
//         this.onLoad && this.onLoad(this);
//       });

//     window.addEventListener('resize', this._onresize);
//   }
//   /**
//    *  获取场景父级元素
//    * @param domElement
//    */
//   getDomElement(domElement: string | HTMLElement): HTMLElement {
//     let dom: HTMLElement = typeof domElement === 'string' ? document.querySelector(domElement) : domElement;
//     if (!dom) {
//       dom = document.body;
//       dom.style.width = '100%';
//       dom.style.height = '100vh';
//     }
//     this.width = dom.clientWidth || window.innerWidth;
//     this.height = dom.clientHeight || window.innerHeight;
//     return dom;
//   }
//   /**
//    *  初始化渲染器
//    * @param config k3d.WebGLRendererParameters
//    * @returns THREE.WebGLRenderer
//    */
//   initRenderer(config: k3d.WebGLRendererParameters = {}): THREE.WebGLRenderer {
//     const configs = [
//       'autoClear',
//       'autoClearColor',
//       'autoClearDepth',
//       'autoClearStencil',
//       'outputColorSpace',
//       'localClippingEnabled',
//       'clippingPlanes',
//       'useLegacyLights',
//       'sortObjects',
//       'toneMapping',
//       'toneMappingExposure',
//     ];
//     const renderer = new THREE.WebGLRenderer(_.omit(config, [...configs, 'gui']));
//     // 设置this.reader分辨率
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.setSize(this.width | 0, this.height | 0);
//     this.domElement.appendChild(renderer.domElement);
//     // 设置配置项
//     for (let key in _.pick(config, configs)) {
//       if (_.has(renderer, key)) renderer[key] = config[key];
//     }
//     if (config.gui) {
//       const rendererGui = this.gui.addFolder('renderer');
//       if (!config.toneMappingExposure) config.toneMappingExposure = 1;
//       rendererGui
//         .add(config, 'toneMappingExposure')
//         .step(0.001)
//         .onChange((value) => {
//           renderer.toneMappingExposure = value;
//         });
//     }
//     this.initCSS2DRenderer();
//     this.initCSS2DRenderer();
//     return renderer;
//   }
//   /**
//    * 创建css2d渲染器
//    */
//   initCSS2DRenderer() {
//     this.css2dRenderer = new CSS2DRenderer();
//     this.css2dRenderer.setSize(this.width, this.height);
//     this.css2dRenderer.domElement.style.position = 'absolute';
//     this.css2dRenderer.domElement.style.top = '0px';
//     this.css2dRenderer.domElement.style.margin = '0';
//     this.domElement.appendChild(this.css2dRenderer.domElement);
//   }
//   /**
//    * 创建css3d渲染器
//    */
//   initCSS3DRenderer() {
//     this.css3dRenderer = new CSS3DRenderer();
//     this.css3dRenderer.setSize(this.width, this.height);
//     this.css3dRenderer.domElement.style.position = 'absolute';
//     this.css3dRenderer.domElement.style.top = '0px';
//     this.css3dRenderer.domElement.style.zIndex = '2';
//     this.css3dRenderer.domElement.style.margin = '0';
//     this.domElement.appendChild(this.css3dRenderer.domElement);
//   }
//   /**
//    * 创建css2d面板
//    * @param option
//    * @returns
//    */
//   css2d(option: {
//     html: string;
//     target?: THREE.Group;
//     position?: k3d.numberArray3;
//     center?: [number, number];
//     className?: string;
//   }): CSS2DObject {
//     if (!this.css2dRenderer) this.initCSS2DRenderer();
//     const { html, target = this.scene, position = [0, 0, 0], center = [0, 0], className = 'k3d-plane' } = option;
//     const div = document.createElement('div');
//     div.className = className;
//     div.innerHTML = html;
//     const css2dLabel = new CSS2DObject(div);
//     css2dLabel.position.set(...position);
//     (css2dLabel as Record<any, any>).center.set(...center);
//     target.add(css2dLabel);
//     return css2dLabel;
//   }
//   /**
//    * 创建css3d面板
//    * @param option
//    * @returns
//    */
//   css3d(option: {
//     html: string;
//     target?: THREE.Group;
//     position?: k3d.numberArray3;
//     className?: string;
//     scale?: k3d.numberArray3;
//     rotation?: k3d.numberArray3;
//   }): CSS3DObject {
//     if (!this.css2dRenderer) this.initCSS3DRenderer();
//     const { html, target = this.scene, position = [0, 0, 0], className = 'k3d-plane', scale = [1, 1, 1] } = option;
//     const div = document.createElement('div');
//     div.className = className;
//     div.innerHTML = html;
//     const css3dLabel = new CSS3DObject(div);
//     css3dLabel.position.set(...position);
//     css3dLabel.scale.set(...scale);
//     target.add(css3dLabel);
//     return css3dLabel;
//   }
//   /**
//    * 初始化场景
//    * @param config
//    * @returns THREE.Scene
//    */
//   initScene(config: k3d.SceneParameters): THREE.Scene {
//     const scene = new THREE.Scene();
//     if (!config) return scene;
//     let param = {
//       background: null,
//       backgroundBlurriness: 0,
//     };
//     config = Object.assign(param, config);
//     if (config.background) {
//       if (isColor(config.background)) {
//         // 场景背景是颜色时
//         scene.background = new THREE.Color(config.background as k3d.color);
//       } else {
//         if (config.background instanceof THREE.Texture) scene.background = config.background;
//         // 场景背景是图片时，如果时天空盒，使用sky实现
//         else
//           textureLoader(config.background as string).then((texture) => {
//             scene.background = texture;
//           });
//       }
//     }
//     if (config.gui) {
//       const sceneGui = this.gui.addFolder('scene');
//       if (isColor(config.background) || config.background === null)
//         sceneGui.addColor(config, 'background').onChange((val) => {
//           scene.background = new THREE.Color(val);
//         });
//     }
//     return scene;
//   }

//   /**
//    * 初始化摄像机
//    */
//   initCamera(config: k3d.CameraParameters = {}): THREE.PerspectiveCamera | THREE.OrthographicCamera {
//     console.log('camera');
//     if (!config.type) config.type = 'PerspectiveCamera';
//     const { near = 1, far = 1000, position = [0, 0, 0], target = [0, 0, 0] } = config;
//     let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
//     if (config.type === 'OrthographicCamera') {
//       // 正交相机
//       const { offset } = config as k3d.OrthographicCameraParameters;
//       camera = new THREE.OrthographicCamera(
//         this.width / -offset,
//         this.width / offset,
//         this.height / offset,
//         this.height / -offset,
//         near,
//         far
//       );
//     } else if (config.type == 'PerspectiveCamera') {
//       // 透视相机
//       const { fov = 50, aspect = this.width / this.height } = config as k3d.PerspectiveCameraParameters;
//       camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//       if ((config as k3d.PerspectiveCameraParameters).focus)
//         camera.focus = (config as k3d.PerspectiveCameraParameters).focus;
//     } else throw new Error('k3d中未实现"' + config.type + '"相机，请自行实现');
//     if (config.zoom) camera.zoom = config.zoom;
//     camera.position.set(...(position as k3d.numberArray3));
//     camera.lookAt(...(target as k3d.numberArray3));
//     // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用
//     camera.updateProjectionMatrix();
//     this.scene.add(camera);
//     // 图形调节参数
//     if (config.gui) {
//       const cameraGui = this.gui.addFolder('camera');
//       if (config.type == 'PerspectiveCamera') {
//         if (!(config as k3d.PerspectiveCameraParameters).fov) (config as k3d.PerspectiveCameraParameters).fov = 50;
//         cameraGui
//           .add(config, 'fov')
//           .step(0.01)
//           .onChange((value) => {
//             (camera as THREE.PerspectiveCamera).fov = value;
//             camera.updateProjectionMatrix();
//           });
//       }
//       if (!config.near) config.near = 1;
//       cameraGui
//         .add(config, 'near')
//         .step(0.01)
//         .onChange((value) => {
//           camera.near = value;
//           camera.updateProjectionMatrix();
//         });
//       if (!config.far) config.far = 1000;
//       cameraGui
//         .add(config, 'far')
//         .step(0.01)
//         .onChange((value) => {
//           camera.far = value;
//           camera.updateProjectionMatrix();
//         });
//     }
//     return camera;
//   }

//   // 创建光源
//   initLight(config: k3d.LightParameters = {}) {
//     if (_.has(config, 'AmbientLight')) this.initAmbientLight(config.AmbientLight);
//     if (_.has(config, 'DirectionalLight')) this.initDirectionalLight(config.DirectionalLight);
//     if (_.has(config, 'HemisphereLight')) this.initHemisphereLight(config.HemisphereLight);
//   }
//   /**
//    * 创建环境光
//    * @param config
//    */
//   initAmbientLight(config: k3d.LightParameters['AmbientLight']) {
//     console.log('AmbientLight');
//     const { position = [0, 0, 0], color = '#ffffff', intensity = 1 } = config;
//     const light = new THREE.AmbientLight(color, intensity);
//     light.position.set(...(position as k3d.numberArray3));
//     this.ambientLight = light;
//     this.scene.add(light);
//     if (config.gui) {
//       const ambientLightGui = this.gui.addFolder('AmbientLight');
//       if (!config.color) config.color = '#ffffff';
//       ambientLightGui.addColor(config, 'color').onChange((value) => {
//         light.color = new THREE.Color(value);
//       });
//       if (!config.intensity) config.intensity = 1;
//       ambientLightGui
//         .add(config, 'intensity', 0)
//         .step(0.001)
//         .onChange((value) => {
//           light.intensity = value;
//         });
//     }
//   }
//   /**
//    * 创建平行光
//    * @param config
//    */
//   initDirectionalLight(config: k3d.LightParameters['DirectionalLight']) {
//     console.log('DirectionalLight');
//     const { position = [0, 0, 0], color = '#ffffff', target, intensity = 1 } = config;
//     const light = new THREE.DirectionalLight(color, intensity);
//     if (target) {
//       light.target = new THREE.Object3D();
//       light.target.position.set(...(target as k3d.numberArray3));
//     }
//     light.position.set(...(position as k3d.numberArray3));
//     this.directionalLight = light;
//     this.scene.add(light);
//     if (config.gui) {
//       const directionalLightGui = this.gui.addFolder('DirectionalLight');
//       if (!config.color) config.color = '#ffffff';
//       directionalLightGui.addColor(config, 'color').onChange((value) => {
//         light.color = new THREE.Color(value);
//       });
//       if (!config.intensity) config.intensity = 1;
//       directionalLightGui
//         .add(config, 'intensity', 0)
//         .step(0.001)
//         .onChange((value) => {
//           light.intensity = value;
//         });
//     }
//   }
//   /**
//    * 创建半球光
//    * @param config
//    */
//   initHemisphereLight(config: k3d.LightParameters['HemisphereLight']) {
//     console.log('HemisphereLight');
//     const { position = [0, 0, 0], color = 0xffffff, groundColor = 0xffffff, intensity = 1 } = config;
//     const light = new THREE.HemisphereLight(color, groundColor, intensity);
//     light.position.set(...(position as k3d.numberArray3));
//     this.hemisphereLight = light;
//     this.scene.add(light);
//     if (config.gui) {
//       const hemisphereLightGui = this.gui.addFolder('HemisphereLight');
//       if (!config.color) config.color = '#ffffff';
//       hemisphereLightGui.addColor(config, 'color').onChange((value) => {
//         light.color = new THREE.Color(value);
//       });
//       if (!config.groundColor) config.groundColor = '#ffffff';
//       hemisphereLightGui.addColor(config, 'groundColor').onChange((value) => {
//         light.groundColor = new THREE.Color(value);
//       });
//       if (!config.intensity) config.intensity = 1;
//       hemisphereLightGui
//         .add(config, 'intensity', 0)
//         .step(0.001)
//         .onChange((value) => {
//           light.intensity = value;
//         });
//     }
//   }

//   /**
//    * 创建控制器
//    */
//   initControls(config: k3d.ControlsParameters = {}) {
//     const render = this.css3dRenderer || this.css2dRenderer || this.renderer;
//     console.log(config);
//     const controls: OrbitControls = new OrbitControls(this.camera, render.domElement);

//     if (config.target) {
//       controls.target.set(...(config.target as k3d.numberArray3));
//       delete config.target;
//     }
//     for (const key in config) {
//       if (_.has(config, key) && _.has(controls, key)) {
//         controls[key] = config[key];
//       }
//     }
//     controls.mouseButtons = {
//       LEFT: THREE.MOUSE.ROTATE,
//       MIDDLE: THREE.MOUSE.DOLLY,
//       RIGHT: THREE.MOUSE.PAN,
//     };
//     controls.update();
//     // 控制器变化更新渲染
//     controls.addEventListener('change', () => !this.renderRequested && this.renderTimer());
//     if (config.gui) {
//       const controlsGui = this.gui.addFolder('controls');
//       if (!_.has(config, 'autoRotate')) config.autoRotate = false;
//       controlsGui.add(config, 'autoRotate').onChange((value) => {
//         controls.autoRotate = value;
//       });
//       if (!_.has(config, 'autoRotateSpeed')) config.autoRotateSpeed = 2;
//       controlsGui
//         .add(config, 'autoRotateSpeed')
//         .step(0.01)
//         .onChange((value) => {
//           controls.autoRotateSpeed = value;
//         });
//       if (!_.has(config, 'enableDamping')) config.enableDamping = false;
//       controlsGui.add(config, 'enableDamping').onChange((value) => {
//         controls.enableDamping = value;
//       });
//       if (!_.has(config, 'dampingFactor')) config.dampingFactor = 0.05;
//       controlsGui
//         .add(config, 'dampingFactor')
//         .step(0.0001)
//         .onChange((value) => {
//           controls.dampingFactor = value;
//         });
//       if (!_.has(config, 'enabled')) config.enabled = true;
//       controlsGui.add(config, 'enabled').onChange((value) => {
//         controls.enabled = value;
//       });
//       if (!_.has(config, 'enablePan')) config.enablePan = true;
//       controlsGui.add(config, 'enablePan').onChange((value) => {
//         controls.enablePan = value;
//       });
//       if (!_.has(config, 'screenSpacePanning')) config.screenSpacePanning = true;
//       controlsGui.add(config, 'screenSpacePanning').onChange((value) => {
//         controls.screenSpacePanning = value;
//       });
//       if (!_.has(config, 'panSpeed')) config.panSpeed = 1;
//       controlsGui
//         .add(config, 'panSpeed')
//         .step(0.01)
//         .onChange((value) => {
//           controls.panSpeed = value;
//         });
//       if (!_.has(config, 'enableRotate')) config.enableRotate = true;
//       controlsGui.add(config, 'enableRotate').onChange((value) => {
//         controls.enableRotate = value;
//       });
//       if (!_.has(config, 'rotateSpeed')) config.rotateSpeed = 1;
//       controlsGui
//         .add(config, 'rotateSpeed')
//         .step(0.01)
//         .onChange((value) => {
//           controls.rotateSpeed = value;
//         });
//       if (!_.has(config, 'enableZoom')) config.enableZoom = true;
//       controlsGui.add(config, 'enableZoom').onChange((value) => {
//         controls.enableZoom = value;
//       });
//       if (!_.has(config, 'maxAzimuthAngle')) config.maxAzimuthAngle = Infinity;
//       controlsGui
//         .add(config, 'maxAzimuthAngle', -2 * Math.PI, 2 * Math.PI)
//         .step(0.01)
//         .onChange((value) => {
//           controls.maxAzimuthAngle = value;
//         });
//       if (!_.has(config, 'minAzimuthAngle')) config.minAzimuthAngle = Infinity;
//       controlsGui
//         .add(config, 'minAzimuthAngle', -2 * Math.PI, 2 * Math.PI)
//         .step(0.01)
//         .onChange((value) => {
//           controls.minAzimuthAngle = value;
//         });
//       if (!_.has(config, 'maxPolarAngle')) config.maxPolarAngle = Math.PI;
//       controlsGui
//         .add(config, 'maxPolarAngle', 0, Math.PI)
//         .step(0.01)
//         .onChange((value) => {
//           controls.maxPolarAngle = value;
//         });
//       if (!_.has(config, 'minPolarAngle')) config.minPolarAngle = 0;
//       controlsGui
//         .add(config, 'minPolarAngle', 0, Math.PI)
//         .step(0.01)
//         .onChange((value) => {
//           controls.minPolarAngle = value;
//         });
//       if ((this.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
//         if (!_.has(config, 'maxDistance')) config.maxDistance = Infinity;
//         controlsGui
//           .add(config, 'maxDistance')
//           .step(0.01)
//           .onChange((value) => {
//             controls.maxDistance = value;
//           });
//         if (!_.has(config, 'minDistance')) config.minDistance = 0;
//         controlsGui
//           .add(config, 'minDistance')
//           .step(0.01)
//           .onChange((value) => {
//             controls.minDistance = value;
//           });
//       } else {
//         if (!_.has(config, 'maxZoom')) config.maxZoom = Infinity;
//         controlsGui
//           .add(config, 'maxZoom')
//           .step(0.01)
//           .onChange((value) => {
//             controls.maxZoom = value;
//           });
//         if (!_.has(config, 'minZoom')) config.minZoom = 0;
//         controlsGui
//           .add(config, 'minZoom')
//           .step(0.01)
//           .onChange((value) => {
//             controls.minZoom = value;
//           });
//       }
//     }
//     return controls;
//   }
//   /**
//    * 创建天空盒
//    * @param urls string | string[]
//    * @returns THREE.Texture
//    */
//   async initSky(urls: string | string[]) {
//     if (typeof urls == 'string' || urls.length == 1) {
//       let url = typeof urls == 'string' ? urls : urls[0];
//       const texture = await textureLoader(url);
//       const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
//       rt.fromEquirectangularTexture(this.renderer, texture);
//       this.scene.background = rt.texture;
//       this.sky = rt.texture;
//     } else {
//       const loader = new THREE.CubeTextureLoader();
//       const texture = loader.load(urls);
//       this.scene.background = texture;
//       this.sky = texture;
//     }
//   }
//   /**
//    * 创建雾
//    */
//   initFog(option: k3d.FogParameters = {}): THREE.Fog {
//     let param = {
//       color: '#ffffff',
//       near: 1,
//       far: 1000,
//     };
//     option = Object.assign(param, option);
//     const fog = new THREE.Fog(option.color, option.near, option.far);
//     this.scene.fog = fog;
//     if (option.gui) {
//       const fogGui = this.gui.addFolder('fog');
//       fogGui.addColor(option, 'color').onChange((val) => fog.color.set(val));
//       fogGui
//         .add(option, 'near')
//         .step(0.01)
//         .onChange((val) => (fog.near = val));
//       fogGui
//         .add(option, 'far')
//         .step(0.01)
//         .onChange((val) => (fog.far = val));
//     }
//     return fog;
//   }

//   /**
//    * 创建阴影
//    * @param option
//    */
//   initShadow(option: k3d.ShadowParameters) {
//     this.renderer.shadowMap.enabled = true;
//     this.directionalLight.castShadow = true;
//     this.directionalLight.shadow.mapSize.width = option.size || 512;
//     this.directionalLight.shadow.mapSize.height = option.size || 512;
//     this.directionalLight.shadow.camera.near = option.near || 1;
//     this.directionalLight.shadow.camera.far = option.far || 1000;
//     this.directionalLight.shadow.camera.top = option.offset || 2;
//     this.directionalLight.shadow.camera.bottom = -option.offset || -2;
//     this.directionalLight.shadow.camera.left = -option.offset || -2;
//     this.directionalLight.shadow.camera.right = option.offset || 2;
//   }
//   /**
//    * 加载模型
//    */
//   modelLoads(urls: string | string[]) {
//     const load = async (url: string) => {
//       let mode: THREE.Mesh = await this.modelLoad(url);
//       if (typeof this.onprogress === 'function') this.onprogress(mode);
//     };
//     if (typeof urls == 'string') {
//       load(urls).then(() => {
//         if (!this.renderRequested) this.renderTimer();
//         else this.animate();
//         if (typeof this.onLoad === 'function') this.onLoad(this);
//       });
//     } else {
//       let loads = [];
//       for (const iterator of urls) {
//         loads.push(load(iterator));
//       }
//       Promise.all(loads).then(() => {
//         if (!this.renderRequested) this.renderTimer();
//         else this.animate();
//         if (typeof this.onLoad === 'function') this.onLoad(this);
//       });
//     }
//   }
//   /**
//    * 渲染通道
//    */
//   initRenderPass() {
//     this.renderScene = new RenderPass(this.scene, this.camera);
//   }
//   /**
//    * 后期
//    */
//   initComposer() {
//     if (!this.renderScene) this.initRenderPass();
//     this.effectComposer = new EffectComposer(this.renderer);
//     this.effectComposer.setPixelRatio(window.devicePixelRatio);
//     this.effectComposer.setSize(this.width, this.height);
//     this.effectComposer.addPass(this.renderScene);
//   }

//   /**
//    * 滤镜
//    * @param option
//    */
//   initBSC(option: k3d.FilterParameters) {
//     console.log('filter');
//     if (!this.effectComposer) this.initComposer();
//     const BSCShader = {
//       uniforms: {
//         tDiffuse: { value: null },
//         _Brightness: { value: 1 },
//         _Saturation: { value: 1 },
//         _Contrast: { value: 1 },
//       },

//       vertexShader: /* glsl */ `
//         varying vec2 vUv;
//         void main() {
//           vUv = uv;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//         }`,

//       fragmentShader: /* glsl */ `
//         uniform sampler2D tDiffuse;
//         uniform float _Brightness;
//         uniform float _Saturation;
//         uniform float _Contrast;
//         varying vec2 vUv;
//         vec3 lerpColor(vec3 col1,vec3 col2, float value){
//           vec3 newCol = vec3 ((col1.r * (1.0 - value) + col2.r * value), (col1.g * (1.0 - value) + col2.g * value), (col1.b * (1.0 - value) + col2.b * value));
//           return newCol;
//         }
//         float mylerp(float a,float b, float value){
//           return (a * (1.0 - value) + b * value);
//         }
//         void main() {
//           // 获取原图的颜色rgba
//           vec4 color = texture2D(tDiffuse, vUv);
//           //brigtness亮度直接乘以一个系数，也就是RGB整体缩放，调整亮度
//           vec3 finalColor = color.rgb * _Brightness;
//           //saturation饱和度：首先根据公式计算同等亮度情况下饱和度最低的值：
//           float gray = 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b;
//           vec3 grayColor = vec3(gray, gray, gray);
//           //根据Saturation在饱和度最低的图像和原图之间差值
//           finalColor = lerpColor(grayColor, finalColor, _Saturation);
//           //contrast对比度：首先计算对比度最低的值
//           vec3 avgColor = vec3(0.5, 0.5, 0.5);
//           //根据Contrast在对比度最低的图像和原图之间差值
//           finalColor = lerpColor(avgColor, finalColor, _Contrast);
//           // 结果rgb,透明度保持原值即可
//           gl_FragColor = vec4(vec3(finalColor), color.a);
//         }`,
//     };
//     // 添加 RGB 颜色分离效果通道效果
//     let effect = new ShaderPass(BSCShader);
//     // effect.uniforms[ '_Brightness' ].value = 0.015;
//     effect.uniforms['_Brightness'].value = option.brightness;
//     effect.uniforms['_Saturation'].value = option.saturation;
//     effect.uniforms['_Contrast'].value = option.contrast;
//     this.effectComposer.addPass(effect);
//     if (option.gui && this.gui) {
//       const BSCgui = this.gui.addFolder('filter');
//       BSCgui.add(option, 'brightness', 0, 10)
//         .step(0.01)
//         .onChange((value: number) => {
//           effect.uniforms['_Brightness'].value = value;
//         });
//       BSCgui.add(option, 'saturation', 0, 10)
//         .step(0.01)
//         .onChange((value: number) => {
//           effect.uniforms['_Saturation'].value = value;
//         });
//       BSCgui.add(option, 'contrast', 0, 10)
//         .step(0.01)
//         .onChange((value: number) => {
//           effect.uniforms['_Contrast'].value = value;
//         });
//     }
//   }
//   /**
//    * 创建辉光
//    * @param option
//    */
//   initBloom(option: k3d.BloomParameters) {
//     console.log('Bloom');
//     if (!this.effectComposer) this.initComposer();
//     const unrealBloomPass = new UnrealBloomPass(
//       new THREE.Vector2(option.width || this.width, option.height || this.height),
//       option.strength,
//       option.radius,
//       option.threshold
//     );
//     this.effectComposer.addPass(unrealBloomPass);
//     if (option.gui && this.gui) {
//       const Bloomgui = this.gui.addFolder('Bloom');
//       Bloomgui.add(unrealBloomPass, 'strength', 0).step(0.001);
//       Bloomgui.add(unrealBloomPass, 'radius', 0).step(0.0001);
//       Bloomgui.add(unrealBloomPass, 'threshold', 0).step(0.001);
//     }
//   }
//   /**
//    * 添加辉光物体
//    */
//   addBloom(object: THREE.Object3D<THREE.Event>) {
//     if (!this.finalComposer) this.initFinalComposer();
//     object.layers.enable(this.BLOOM_SCENE);
//   }
//   /**
//    * 切换添加辉光物体
//    */
//   toggleBloom(object: THREE.Object3D<THREE.Event>) {
//     object.layers.toggle(this.BLOOM_SCENE);
//   }
//   // 创建部分辉光正常渲染的后期
//   initFinalComposer() {
//     // 产生辉光的后期
//     if (!this.effectComposer) this.initComposer();
//     // 产生辉光的后期不渲染到屏幕
//     this.effectComposer.renderToScreen = false;
//     this.bloomLayer = new THREE.Layers();
//     this.bloomLayer.set(this.BLOOM_SCENE);
//     const finalPass = new ShaderPass(
//       new THREE.ShaderMaterial({
//         uniforms: {
//           baseTexture: { value: null },
//           bloomTexture: { value: this.effectComposer.renderTarget2.texture },
//         },
//         vertexShader: `
//         varying vec2 vUv;

//         void main() {

//           vUv = uv;

//           gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

//         }`,
//         fragmentShader: `
//           uniform sampler2D baseTexture;
//           uniform sampler2D bloomTexture;

//           varying vec2 vUv;

//           void main() {

//             gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

// 			  }`,
//         defines: {},
//       }),
//       'baseTexture'
//     );
//     finalPass.needsSwap = true;
//     this.finalComposer = new EffectComposer(this.renderer);
//     this.finalComposer.setPixelRatio(window.devicePixelRatio);
//     this.finalComposer.setSize(this.width, this.height);
//     this.finalComposer.addPass(this.renderScene);
//     this.finalComposer.addPass(finalPass);
//   }

//   /**
//    * 创建景深
//    * @param option
//    */
//   initDof(option: k3d.DofParameter) {
//     if (!this.effectComposer) this.initComposer();
//     const bokehPass = new BokehPass(this.scene, this.camera, {
//       focus: option.focus || 1.0,
//       aperture: option.aperture || 0.025,
//       maxblur: option.maxblur || 0.01,
//     });
//     this.effectComposer.addPass(bokehPass);

//     if (option.gui) {
//       const dofGui = this.gui.addFolder('dof');
//       if (!option.focus) option.focus = 1.0;
//       if (!option.aperture) option.aperture = 0.025;
//       if (!option.maxblur) option.maxblur = 0.01;
//       dofGui
//         .add(option, 'focus')
//         .step(0.01)
//         .onChange((val) => {
//           bokehPass.uniforms['focus'].value = val;
//         });
//       dofGui
//         .add(option, 'aperture')
//         .step(0.0001)
//         .onChange((val) => {
//           bokehPass.uniforms['aperture'].value = val;
//         });
//       dofGui
//         .add(option, 'maxblur')
//         .step(0.001)
//         .onChange((val) => {
//           bokehPass.uniforms['maxblur'].value = val;
//         });
//     }
//   }
//   /**
//    * 描边效果
//    */
//   initOutLine(config: k3d.OutLineParameters) {
//     if (!this.effectComposer) this.initComposer();
//     this.outlinePass = new OutlinePass(
//       new THREE.Vector2(this.width, this.height),
//       this.scene,
//       this.camera as THREE.Camera
//     );
//     /**
//      * 重写this.outlineObjects 的add和delete方法
//      */
//     this.rewriteSet(this.outlineObjects, (set: Set<THREE.Mesh>) => {
//       this.outlinePass.selectedObjects = Array.from(set);
//     });
//     for (const key in config) {
//       if (_.has(config, key) && _.has(this.outlinePass, key)) {
//         if (['visibleEdgeColor', 'hiddenEdgeColor'].includes(key))
//           this.outlinePass[key].set(config[key]); // 设置显示的颜色
//         else this.outlinePass[key] = config[key];
//       }
//     }
//     this.effectComposer.addPass(this.outlinePass);
//   }
//   // 重写Set的Add和delete方法
//   rewriteSet(set, func) {
//     const add = set.add;
//     const del = set.delete;
//     set.add = function (object: THREE.Mesh): Set<THREE.Mesh> {
//       let res = add.call(set, object);
//       func(set);
//       return res;
//     };

//     set.delete = function (object: THREE.Mesh): boolean {
//       let res = del.call(set, object);
//       func(set);
//       return res;
//     };
//   }

//   /**
//    * 点击拾取
//    */
//   bindEvent() {
//     const render = this.css3dRenderer || this.css2dRenderer || this.renderer;
//     // 模拟点击事件
//     render.domElement.onmousedown = () => {
//       const _this = this;
//       // 当按下,绑定鼠标放开事件
//       render.domElement.onmouseup = function (event: MouseEvent) {
//         _this.emit({
//           type: 'click',
//           event: _this.getSelectObject(event),
//         });
//         if (_this.renderRequested) _this.renderTimer();
//       };
//       // 当按下时间超过200ms,解绑鼠标放开事件
//       let timer = setTimeout(() => {
//         clearTimeout(timer);
//         render.domElement.onmouseup = null;
//       }, 200);
//     };
//     // 上一个hover物体
//     let preObj;
//     render.domElement.addEventListener(
//       'pointermove',
//       _.throttle((event) => {
//         let mode = this.getSelectObject(event, 'move');
//         // 当前没有选中物体和与上一个选中物体不一致时 置空上一个
//         if (!mode || preObj !== mode.object) {
//           // 当物体不在常亮描边数组中时，删除描边
//           if (!this.outlineObjects.has(preObj) && this.outlinePass)
//             this.outlinePass.selectedObjects = this.outlinePass.selectedObjects.filter((item) => item !== preObj);
//           preObj = null;
//           // 当选中有物体时，添加描边
//           if (mode) {
//             preObj = mode.object;
//             // 当物体不在常亮描边数组中时，添加描边
//             if (!this.outlineObjects.has(preObj)) this.outlinePass.selectedObjects.push(preObj);
//           }
//         }
//         this.emit({
//           type: 'hover',
//           event: mode,
//         });
//         if (this.renderRequested) this.renderTimer();
//       }, 150)
//     );
//   }
//   /**
//    * 浏览器窗口变化执行
//    */
//   onresize() {
//     this.width = this.domElement.clientWidth || window.innerWidth;
//     this.height = this.domElement.clientHeight || window.innerHeight;
//     if ((this.camera as THREE.OrthographicCamera).isOrthographicCamera) {
//       (this.camera as THREE.OrthographicCamera).left = this.width / -2;
//       (this.camera as THREE.OrthographicCamera).right = this.width / 2;
//       (this.camera as THREE.OrthographicCamera).top = this.height / 2;
//       (this.camera as THREE.OrthographicCamera).bottom = this.height / -2;
//     } else {
//       (this.camera as THREE.PerspectiveCamera).aspect = this.width / this.height;
//     }
//     this.camera.updateProjectionMatrix();
//     if (this.outlinePass) this.outlinePass.resolution = new THREE.Vector2(this.width, this.height);

//     this.effectComposer && this.effectComposer.setSize(this.width, this.height);
//     this.finalComposer && this.finalComposer.setSize(this.width, this.height);
//     this.renderer.setSize(this.width, this.height);
//     this.css2dRenderer && this.css2dRenderer.setSize(this.width, this.height);
//     this.css3dRenderer && this.css3dRenderer.setSize(this.width, this.height);
//     if (!this.renderRequested) this.renderTimer();
//   }
//   /**
//    * 限时开启动画帧
//    */
//   renderTimer() {
//     if (!this.renderRequested) {
//       this.renderRequested = true;
//       setTimeout(() => {
//         this.renderRequested = false;
//       }, 3000);
//     }
//   }
//   /**
//    * 渲染函数
//    */
//   render() {
//     this.emit('loop');
//     if (this.stats) this.stats.update();
//     const delta = this.clock.getDelta();
//     if (this.controls) this.controls.update();
//     // 如果有后期，刷新后期处理的渲染
//     if (this.effectComposer) {
//       // 如果有部分辉光
//       if (this.finalComposer) this.bloomAnimate();
//       else this.effectComposer.render(delta);
//     } else this.renderer.render(this.scene, this.camera);
//     this.css2dRenderer && this.css2dRenderer.render(this.scene, this.camera);
//     this.css3dRenderer && this.css3dRenderer.render(this.scene, this.camera);
//     for (const iterator of this.mixers) {
//       iterator.update(delta);
//     }
//     this.TWEEN.update();
//   }
//   /**
//    * 部分辉光执行
//    */
//   bloomAnimate() {
//     // 1. 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
//     this.scene.traverse((obj: THREE.Mesh) => {
//       const material: THREE.Material = obj.material as THREE.Material;
//       if (material && this.bloomLayer.test(obj.layers) === false) {
//         this.materials[obj.uuid] = material;
//         if (!this.darkMaterials[material.type]) {
//           const Proto = Object.getPrototypeOf(material).constructor;
//           this.darkMaterials[material.type] = new Proto({ color: 0x000000 });
//         }
//         obj.material = this.darkMaterials[material.type];
//       }
//     });
//     // 2. 用 bloomComposer 产生辉光
//     this.effectComposer.render();
//     // 3. 将转成黑色材质的物体还原成初始材质
//     this.scene.traverse((obj: THREE.Mesh) => {
//       if (this.materials[obj.uuid]) {
//         obj.material = this.materials[obj.uuid];
//         delete this.materials[obj.uuid];
//       }
//     });
//     // 4. 用 finalComposer 作最后渲染
//     this.finalComposer.render();
//   }
//   /**
//    * 动画帧
//    */
//   animate() {
//     if (this.renderRequested) {
//       this.render();
//       requestAnimationFrame(() => this.animate && this.animate());
//     }
//   }

//   /**
//    * 模型加载
//    * @param url
//    * @returns
//    */
//   modelLoad(url: string): Promise<THREE.Mesh> {
//     return new Promise((reslove, reject) => {
//       try {
//         modeLoader(url, (mode, mixer, mixerActions) => {
//           if (mixer) this.mixers.push(mixer);
//           if (mixerActions) this.mixerActions[mode.name] = mixerActions;
//           this.scene.add(mode);
//           mode.traverse((child: any) => {
//             if (child.isMesh && this.renderer?.shadowMap?.enabled) {
//               child.castShadow = true;
//               child.receiveShadow = false;
//             }
//           });
//           this.modes.push(mode);
//           reslove(mode);
//         });
//       } catch (err) {
//         reject(err);
//       }
//     });
//   }
//   /**
//    * 鼠标选取对象
//    * @param event
//    * @param type
//    * @returns
//    */
//   getSelectObject(event: MouseEvent, type = 'click'): THREE.Intersection<THREE.Object3D<THREE.Event>> {
//     // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
//     const raycaster = new THREE.Raycaster();
//     const pointer = new THREE.Vector2();
//     // 计算鼠标在元素的位置，由鼠标对于窗口位置减去元素位置
//     let x = event.clientX - (event.target as HTMLElement).offsetLeft;
//     let y = event.clientY - (event.target as HTMLElement).offsetTop;
//     pointer.x = (x / this.width) * 2 - 1;
//     pointer.y = -(y / this.height) * 2 + 1;
//     // 通过摄像机和鼠标位置更新射线
//     raycaster.setFromCamera(pointer, this.camera as THREE.Camera);
//     // 计算物体和射线的焦点
//     const intersects = raycaster.intersectObjects(
//       type == 'click' ? Array.from(this.clickObjects) : Array.from(this.hoverObjects)
//     );
//     return intersects[0];
//   }
//   // 截屏
//   screenCapture() {
//     this.renderer.render(this.scene, this.camera as THREE.Camera);
//     const herf = this.renderer.domElement.toDataURL('image/png');
//     const a = document.createElement('a');
//     a.download = Date.now() + '.png';
//     a.href = herf;
//     a.click();
//   }
//   /**
//    * 销毁
//    */
//   dispose() {
//     this.domElement = null;
//     window.removeEventListener('resize', this._onresize);
//     this.renderRequested = false;
//     this.scene.traverse((child: any) => {
//       child.dispose && child.dispose();
//     });
//   }
// }
