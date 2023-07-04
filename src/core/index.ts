///<reference path = "../types/K3d.d.ts" />
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import WebGL from './WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Stats from 'three/examples/jsm/libs/stats.module.js';

// 后期渲染关键库
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import modeLoader from './modeLoader';
import textureLoader from './textureLoader';

import Events from './events';

// GUI
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import _ from 'lodash';

const hasOwnProperty = Object.prototype.hasOwnProperty;
type vec3 = [number, number, number];
type camera = THREE.PerspectiveCamera | THREE.OrthographicCamera;
type obj = { [key: string]: any };

class Myset<T> extends Set<T> {
  toggle(object: T) {
    if (this.has(object)) this.delete(object);
    else this.add(object);
    return true;
  }
}
class K3d extends Events {
  BLOOM_SCENE = 1;
  TWEEN = TWEEN;
  scene: THREE.Scene = new THREE.Scene();
  clock: THREE.Clock = new THREE.Clock();
  stats?: Stats;
  gui?: GUI;
  domElement: HTMLElement = document.body;
  width: number = window.innerWidth;
  height: number = window.innerHeight;
  render!: THREE.WebGLRenderer;
  css2dRenderer!: CSS2DRenderer;
  css3dRenderer!: CSS3DRenderer;
  camera!: camera;
  directionalLight?: THREE.DirectionalLight;
  ambientLight?: THREE.AmbientLight;
  hemisphereLight?: THREE.HemisphereLight;
  controls!: OrbitControls;
  fog?: THREE.Fog;
  private timeRenderTimer?: number;
  _renderEnabled: boolean = true;
  mixers: THREE.AnimationMixer[] = [];
  mixerActions: { [a: string]: THREE.AnimationAction[] } = {};
  renderScene!: RenderPass;
  effectComposer!: EffectComposer;
  finalComposer?: EffectComposer;
  bloomLayer?: THREE.Layers;
  outlinePass?: OutlinePass;
  clickObjects: Set<THREE.Mesh> = new Set();
  hoverObjects: Set<THREE.Mesh> = new Set();
  outlineObjects: Myset<THREE.Mesh> = new Myset();
  materials: { [key: string]: THREE.Material } = {};
  darkMaterials: { [key: string]: THREE.Material } = {};
  modes: THREE.Mesh[] = [];
  onload?: (k3d: K3d) => void;
  onprogress?: (gltf: THREE.Mesh) => void;
  set renderEnabled(val) {
    this._renderEnabled = val;
    if (val) this.timeRender();
  }
  get renderEnabled() {
    return this._renderEnabled;
  }
  constructor(option: k3dParam) {
    super();
    this.getDomElement(option.domElement);
    if (!WebGL.isWebGLAvailable()) {
      const warning = WebGL.getWebGLErrorMessage();
      this.domElement && this.domElement.appendChild(warning);
      return;
    }
    if (option.renderEnabled === false) this.renderEnabled = option.renderEnabled;
    // 加载完成更新渲染
    if (!this.renderEnabled) THREE.DefaultLoadingManager.onLoad = () => this.timeRender();
    if (option.stats) {
      this.stats = new Stats();
      this.domElement.append(this.stats.dom);
    }
    if (option.gui) {
      this.gui = new GUI({ title: 'K3d参数调节' });
      this.gui.onChange(() => {
        if (!this.renderEnabled) this.timeRender();
      });
    }
    this.InitRender(option.render);
    this.InitScene(option.scene);
    this.initCamera(option.camera);
    this.initLight(option.light);
    this.initControls(option.controls);
    this.initComposer();
    if (option.fog) this.initFog(option.fog);
    if (option.shadow) this.initShadow(option.shadow);
    if (option.filter) this.initBSC(option.filter);
    if (option.bloom) this.initBloom(option.bloom);
    // 景深一定放在辉光后面
    if (option.dof) this.initDof(option.dof);
    if (option.outline) this.initOutLine(option.outline);
    if (option.models) this.modelLoads(option.models);
    // 此处使用异步方法执行onload
    else Promise.resolve().then(option.onload.bind(this, this));
    this.animate();
    if (option.onload) this.onload = option.onload;
    if (option.onprogress) this.onprogress = option.onprogress;
    window.addEventListener(
      'resize',
      _.debounce(() => this.onresize(option.camera), 150)
    );
    // 绑定事件
    this.bindEvent();
  }
  /**
   *  获取放置场景dom元素,默认body
   *  @param domElement class|id|dom
   **/
  getDomElement(domElement: string | HTMLElement) {
    if (typeof domElement === 'string') this.domElement = document.querySelector(domElement) as HTMLElement;
    else this.domElement = domElement;
    if (!this.domElement) {
      this.domElement = document.body;
      this.domElement.style.width = '100%';
      this.domElement.style.height = '100vh';
    }
    this.width = this.domElement?.clientWidth || window.innerWidth;
    this.height = this.domElement?.clientHeight || window.innerHeight;
  }
  /**
   * 初始化渲染器
   * 参数 {@link THREE.WebGLRendererParameters}
   */
  InitRender(parameters: k3d.WebGLRendererParameters = {}) {
    console.log('render');
    this.render = new THREE.WebGLRenderer(
      _.omit(parameters, ['outputColorSpace', 'toneMapping', 'toneMappingExposure'])
    );
    // 设置this.reader分辨率
    this.render.setPixelRatio(window.devicePixelRatio);
    this.render.setSize(this.width | 0, this.height | 0);
    this.domElement.appendChild(this.render.domElement);
    if (
      hasOwnProperty.call(parameters, 'outputColorSpace') &&
      parameters.outputColorSpace &&
      hasOwnProperty.call(this.render, 'outputColorSpace')
    ) {
      (this.render as Record<any, any>).outputColorSpace = parameters.outputColorSpace;
    }
    if (hasOwnProperty.call(parameters, 'outputEncoding') && parameters.outputEncoding) {
      this.render.outputEncoding = parameters.outputEncoding;
    }
    if (parameters.toneMapping) this.render.toneMapping = parameters.toneMapping;
    if (parameters.toneMappingExposure) this.render.toneMappingExposure = Math.pow(parameters.toneMappingExposure, 4.0);

    if (parameters.gui) {
      const renderGui = this.gui.addFolder('render');
      if (parameters.toneMappingExposure)
        renderGui
          .add(parameters, 'toneMappingExposure', 0.1, 2)
          .step(0.001)
          .onChange((value) => {
            this.render.toneMappingExposure = Math.pow(value, 4.0);
          });
    }
  }

  /**
   * 初始化场景
   *
   */
  InitScene(config: k3d.SceneParameters = {}) {
    console.log('scene');
    this.scene = new THREE.Scene();
    if (typeof config.background == 'string' && /\.[a-z]{2,}$/.test(config.background as string)) {
      // 如果背景为图片,默认纹理使用网格的坐标来进行映射
      textureLoader(config.background as string, (texture) => {
        this.scene.background = texture;
        this.scene.environment = texture;
      });
    } else if (config.background) {
      // 背景为颜色
      this.scene.background = new THREE.Color(config.background);
    }
    // 背景模糊度
    if (!config.backgroundBlurriness) config.backgroundBlurriness = 0;
    this.scene.backgroundBlurriness = config.backgroundBlurriness;
    // 环境贴图
    if (config.environment) {
      if (typeof config.environment == 'string')
        textureLoader(config.environment as string, (texture) => {
          this.scene.environment = texture;
        });
      else if ((config.environment as THREE.Texture).isTexture) {
        this.scene.environment = config.environment as THREE.Texture;
      }
    }
    // 图行参数调节
    if (config.gui) {
      const sceneGui = this.gui.addFolder('scene');
      if (
        config.background &&
        !(typeof config.background == 'string' && /\.[a-z]{2,}$/.test(config.background as string))
      ) {
        sceneGui.addColor(config, 'background').onChange((value) => {
          this.scene.background = new THREE.Color(value);
        });
      }
      sceneGui
        .add(config, 'backgroundBlurriness', 0, 1)
        .step(0.01)
        .onChange((value) => {
          this.scene.backgroundBlurriness = value;
        });
    }
  }

  /**
   * 初始化摄像机
   */
  initCamera(config: k3d.CameraParameters = {}) {
    console.log('camera');
    if (!config.type) config.type = 'PerspectiveCamera';
    const { near = 1, far = 1000, position = [0, 0, 0], target = [0, 0, 0] } = config;
    if (config.type === 'OrthographicCamera') {
      // 正交相机
      const {
        left = this.width / -2,
        right = this.width / 2,
        top = this.height / 2,
        bottom = this.height / -2,
      } = config as k3d.OrthographicCameraParameters;
      this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    } else if (config.type == 'PerspectiveCamera') {
      // 透视相机
      const { fov = 50, aspect = this.width / this.height } = config as k3d.PerspectiveCameraParameters;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      if ((config as k3d.PerspectiveCameraParameters).focus)
        this.camera.focus = (config as k3d.PerspectiveCameraParameters).focus;
    } else throw new Error('k3d中未实现"' + config.type + '"相机，请自行实现');
    if (config.zoom) this.camera.zoom = config.zoom;
    this.camera.position.set(...(position as vec3));
    this.camera.lookAt(...(target as vec3));
    // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用
    this.camera.updateProjectionMatrix();
    this.scene.add(this.camera);
    // 图形调节参数
    if (config.gui) {
      const cameraGui = this.gui.addFolder('camera');
      if (config.type == 'PerspectiveCamera') {
        if (!(config as k3d.PerspectiveCameraParameters).fov) (config as k3d.PerspectiveCameraParameters).fov = 50;
        cameraGui
          .add(config, 'fov')
          .step(0.01)
          .onChange((value) => {
            (this.camera as THREE.PerspectiveCamera).fov = value;
            this.camera.updateProjectionMatrix();
          });
      }
      if (!config.near) config.near = 1;
      cameraGui
        .add(config, 'near')
        .step(0.01)
        .onChange((value) => {
          this.camera.near = value;
          this.camera.updateProjectionMatrix();
        });
      if (!config.far) config.far = 1000;
      cameraGui
        .add(config, 'far')
        .step(0.01)
        .onChange((value) => {
          this.camera.far = value;
          this.camera.updateProjectionMatrix();
        });
    }
  }

  // 创建光源
  initLight(config: k3d.LightParameters = {}) {
    if (hasOwnProperty.call(config, 'AmbientLight')) this.initAmbientLight(config.AmbientLight);
    if (hasOwnProperty.call(config, 'DirectionalLight')) this.initDirectionalLight(config.DirectionalLight);
    if (hasOwnProperty.call(config, 'HemisphereLight')) this.initHemisphereLight(config.HemisphereLight);
  }
  /**
   * 创建环境光
   * @param config
   */
  initAmbientLight(config: k3d.LightParameters['AmbientLight']) {
    console.log('AmbientLight');
    const { position = [0, 0, 0], color = '#ffffff', intensity = 1 } = config;
    const light = new THREE.AmbientLight(color, intensity);
    light.position.set(...(position as vec3));
    this.ambientLight = light;
    this.scene.add(light);
    if (config.gui) {
      const ambientLightGui = this.gui.addFolder('AmbientLight');
      if (!config.color) config.color = '#ffffff';
      ambientLightGui.addColor(config, 'color').onChange((value) => {
        light.color = new THREE.Color(value);
      });
      if (!config.intensity) config.intensity = 1;
      ambientLightGui
        .add(config, 'intensity', 0)
        .step(0.001)
        .onChange((value) => {
          light.intensity = value;
        });
    }
  }
  /**
   * 创建平行光
   * @param config
   */
  initDirectionalLight(config: k3d.LightParameters['DirectionalLight']) {
    console.log('DirectionalLight');
    const { position = [0, 0, 0], color = '#ffffff', target, intensity = 1 } = config;
    const light = new THREE.DirectionalLight(color, intensity);
    if (target) {
      light.target = new THREE.Object3D();
      light.target.position.set(...(target as vec3));
    }
    light.position.set(...(position as vec3));
    this.directionalLight = light;
    this.scene.add(light);
    if (config.gui) {
      const directionalLightGui = this.gui.addFolder('DirectionalLight');
      if (!config.color) config.color = '#ffffff';
      directionalLightGui.addColor(config, 'color').onChange((value) => {
        light.color = new THREE.Color(value);
      });
      if (!config.intensity) config.intensity = 1;
      directionalLightGui
        .add(config, 'intensity', 0)
        .step(0.001)
        .onChange((value) => {
          light.intensity = value;
        });
    }
  }
  /**
   * 创建半球光
   * @param config
   */
  initHemisphereLight(config: k3d.LightParameters['HemisphereLight']) {
    console.log('HemisphereLight');
    const { position = [0, 0, 0], color = 0xffffff, groundColor = 0xffffff, intensity = 1 } = config;
    const light = new THREE.HemisphereLight(color, groundColor, intensity);
    light.position.set(...(position as vec3));
    this.hemisphereLight = light;
    this.scene.add(light);
    if (config.gui) {
      const hemisphereLightGui = this.gui.addFolder('HemisphereLight');
      if (!config.color) config.color = '#ffffff';
      hemisphereLightGui.addColor(config, 'color').onChange((value) => {
        light.color = new THREE.Color(value);
      });
      if (!config.groundColor) config.groundColor = '#ffffff';
      hemisphereLightGui.addColor(config, 'groundColor').onChange((value) => {
        light.groundColor = new THREE.Color(value);
      });
      if (!config.intensity) config.intensity = 1;
      hemisphereLightGui
        .add(config, 'intensity', 0)
        .step(0.001)
        .onChange((value) => {
          light.intensity = value;
        });
    }
  }

  /**
   * 创建控制器
   */
  initControls(config: k3d.ControlsParameters = {}) {
    const render = this.css3dRenderer || this.css2dRenderer || this.render;
    const controls: OrbitControls = new OrbitControls(this.camera, render.domElement);
    if (config.target) {
      controls.target.set(...(config.target as vec3));
      delete config.target;
    }
    for (const key in config) {
      if (hasOwnProperty.call(config, key) && hasOwnProperty.call(controls, key)) {
        (controls as obj)[key] = config[key];
      }
    }
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.update();
    // 控制器变化更新渲染
    if (!this.renderEnabled)
      controls.addEventListener('change', () => {
        this.timeRender();
      });
    this.controls = controls;
    if (config.gui) {
      const controlsGui = this.gui.addFolder('controls');
      if (!_.has(config, 'autoRotate')) config.autoRotate = false;
      controlsGui.add(config, 'autoRotate').onChange((value) => {
        controls.autoRotate = value;
      });
      if (!_.has(config, 'autoRotateSpeed')) config.autoRotateSpeed = 2;
      controlsGui
        .add(config, 'autoRotateSpeed')
        .step(0.01)
        .onChange((value) => {
          controls.autoRotateSpeed = value;
        });
      if (!_.has(config, 'enableDamping')) config.enableDamping = false;
      controlsGui.add(config, 'enableDamping').onChange((value) => {
        controls.enableDamping = value;
      });
      if (!_.has(config, 'dampingFactor')) config.dampingFactor = 0.05;
      controlsGui
        .add(config, 'dampingFactor')
        .step(0.0001)
        .onChange((value) => {
          controls.dampingFactor = value;
        });
      if (!_.has(config, 'enabled')) config.enabled = true;
      controlsGui.add(config, 'enabled').onChange((value) => {
        controls.enabled = value;
      });
      if (!_.has(config, 'enablePan')) config.enablePan = true;
      controlsGui.add(config, 'enablePan').onChange((value) => {
        controls.enablePan = value;
      });
      if (!_.has(config, 'screenSpacePanning')) config.screenSpacePanning = true;
      controlsGui.add(config, 'screenSpacePanning').onChange((value) => {
        controls.screenSpacePanning = value;
      });
      if (!_.has(config, 'panSpeed')) config.panSpeed = 1;
      controlsGui
        .add(config, 'panSpeed')
        .step(0.01)
        .onChange((value) => {
          controls.panSpeed = value;
        });
      if (!_.has(config, 'enableRotate')) config.enableRotate = true;
      controlsGui.add(config, 'enableRotate').onChange((value) => {
        controls.enableRotate = value;
      });
      if (!_.has(config, 'rotateSpeed')) config.rotateSpeed = 1;
      controlsGui
        .add(config, 'rotateSpeed')
        .step(0.01)
        .onChange((value) => {
          controls.rotateSpeed = value;
        });
      if (!_.has(config, 'enableZoom')) config.enableZoom = true;
      controlsGui.add(config, 'enableZoom').onChange((value) => {
        controls.enableZoom = value;
      });
      if (!_.has(config, 'maxAzimuthAngle')) config.maxAzimuthAngle = Infinity;
      controlsGui
        .add(config, 'maxAzimuthAngle', -2 * Math.PI, 2 * Math.PI)
        .step(0.01)
        .onChange((value) => {
          controls.maxAzimuthAngle = value;
        });
      if (!_.has(config, 'minAzimuthAngle')) config.minAzimuthAngle = Infinity;
      controlsGui
        .add(config, 'minAzimuthAngle', -2 * Math.PI, 2 * Math.PI)
        .step(0.01)
        .onChange((value) => {
          controls.minAzimuthAngle = value;
        });
      if (!_.has(config, 'maxPolarAngle')) config.maxPolarAngle = Math.PI;
      controlsGui
        .add(config, 'maxPolarAngle', 0, Math.PI)
        .step(0.01)
        .onChange((value) => {
          controls.maxPolarAngle = value;
        });
      if (!_.has(config, 'minPolarAngle')) config.minPolarAngle = 0;
      controlsGui
        .add(config, 'minPolarAngle', 0, Math.PI)
        .step(0.01)
        .onChange((value) => {
          controls.minPolarAngle = value;
        });
      if ((this.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        if (!_.has(config, 'maxDistance')) config.maxDistance = Infinity;
        controlsGui
          .add(config, 'maxDistance')
          .step(0.01)
          .onChange((value) => {
            controls.maxDistance = value;
          });
        if (!_.has(config, 'minDistance')) config.minDistance = 0;
        controlsGui
          .add(config, 'minDistance')
          .step(0.01)
          .onChange((value) => {
            controls.minDistance = value;
          });
      } else {
        if (!_.has(config, 'maxZoom')) config.maxZoom = Infinity;
        controlsGui
          .add(config, 'maxZoom')
          .step(0.01)
          .onChange((value) => {
            controls.maxZoom = value;
          });
        if (!_.has(config, 'minZoom')) config.minZoom = 0;
        controlsGui
          .add(config, 'minZoom')
          .step(0.01)
          .onChange((value) => {
            controls.minZoom = value;
          });
      }
    }
  }
  modelLoad(url: string): Promise<THREE.Mesh> {
    return new Promise((reslove, reject) => {
      try {
        modeLoader(url, (mode, mixer, mixerActions) => {
          if (mixer) this.mixers.push(mixer);
          if (mixerActions) this.mixerActions[mode.name] = mixerActions;
          this.scene.add(mode);
          mode.traverse((child: any) => {
            if (child.isMesh && this.render?.shadowMap?.enabled) {
              child.castShadow = true;
              child.receiveShadow = false;
            }
          });
          this.modes.push(mode);
          reslove(mode);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  modelLoads(urls: string | string[]) {
    const load = async (url: string) => {
      let mode: THREE.Mesh = await this.modelLoad(url);
      if (typeof this.onprogress === 'function') this.onprogress(mode);
    };
    if (typeof urls == 'string') {
      load(urls).then(() => {
        if (typeof this.onload === 'function') this.onload(this);
      });
    } else {
      let loads = [];
      for (const iterator of urls) {
        loads.push(load(iterator));
      }
      Promise.all(loads).then(() => {
        if (typeof this.onload === 'function') this.onload(this);
      });
    }
  }
  initCSS2DRenderer() {
    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(this.width, this.height);
    this.css2dRenderer.domElement.style.position = 'absolute';
    this.css2dRenderer.domElement.style.top = '0px';
    this.css2dRenderer.domElement.style.margin = '0';
    this.domElement.appendChild(this.css2dRenderer.domElement);
  }
  initCSS3DRenderer() {
    this.css3dRenderer = new CSS3DRenderer();
    this.css3dRenderer.setSize(this.width, this.height);
    this.css3dRenderer.domElement.style.position = 'absolute';
    this.css3dRenderer.domElement.style.top = '0px';
    this.css3dRenderer.domElement.style.zIndex = '2';
    this.css3dRenderer.domElement.style.margin = '0';
    this.domElement.appendChild(this.css3dRenderer.domElement);
  }
  css2d(option: {
    html: string;
    target?: THREE.Group;
    position?: vec3;
    center?: [number, number];
    className?: string;
  }): CSS2DObject {
    if (!this.css2dRenderer) this.initCSS2DRenderer();
    const { html, target = this.scene, position = [0, 0, 0], center = [0, 0], className = 'k3d-plane' } = option;
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = html;
    const css2dLabel = new CSS2DObject(div);
    css2dLabel.position.set(...position);
    (css2dLabel as Record<any, any>).center.set(...center);
    target.add(css2dLabel);
    return css2dLabel;
  }

  css3d(option: {
    html: string;
    target?: THREE.Group;
    position?: vec3;
    className?: string;
    scale?: vec3;
    rotation?: vec3;
  }): CSS3DObject {
    if (!this.css2dRenderer) this.initCSS2DRenderer();
    const { html, target = this.scene, position = [0, 0, 0], className = 'k3d-plane', scale = [1, 1, 1] } = option;
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = html;
    const css3dLabel = new CSS3DObject(div);
    css3dLabel.position.set(...position);
    css3dLabel.scale.set(...scale);
    target.add(css3dLabel);
    return css3dLabel;
  }
  /**
   * 创建雾
   */
  initFog(option: k3d.FogParameters) {
    let { color = '#ffffff', near = 1, far = 1000 } = option;
    this.fog = new THREE.Fog(color, near, far);
    this.scene.fog = this.fog;
    if (option.gui) {
      const fogGui = this.gui.addFolder('fog');
      if (!option.color) option.color = '#ffffff';
      fogGui.addColor(option, 'color').onChange((val) => {
        this.fog.color.set(val);
      });
      fogGui.add(this.fog, 'near').step(0.01);
      fogGui.add(this.fog, 'far').step(0.01);
    }
  }
  /**
   * 创建阴影
   * @param option
   */
  initShadow(option: k3d.ShadowParameters) {
    this.render.shadowMap.enabled = true;
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = option.size || 512;
    this.directionalLight.shadow.mapSize.height = option.size || 512;
    this.directionalLight.shadow.camera.near = option.near || 1;
    this.directionalLight.shadow.camera.far = option.far || 1000;
    this.directionalLight.shadow.camera.top = option.top || 2;
    this.directionalLight.shadow.camera.bottom = option.bottom || -2;
    this.directionalLight.shadow.camera.left = option.left || -2;
    this.directionalLight.shadow.camera.right = option.right || 2;
  }
  /**
   * 渲染通道
   */
  initRenderPass() {
    this.renderScene = new RenderPass(this.scene, this.camera);
  }
  /**
   * 后期
   */
  initComposer() {
    if (!this.renderScene) this.initRenderPass();
    this.effectComposer = new EffectComposer(this.render);
    this.effectComposer.setPixelRatio(window.devicePixelRatio);
    this.effectComposer.setSize(this.width, this.height);
    this.effectComposer.addPass(this.renderScene);
  }

  /**
   * 滤镜
   * @param option
   */
  initBSC(option: k3d.FilterParameters) {
    console.log('filter');
    if (!this.effectComposer) this.initComposer();
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
    this.effectComposer.addPass(effect);
    if (option.gui && this.gui) {
      const BSCgui = this.gui.addFolder('filter');
      BSCgui.add(option, 'brightness', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Brightness'].value = value;
        });
      BSCgui.add(option, 'saturation', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Saturation'].value = value;
        });
      BSCgui.add(option, 'contrast', 0, 10)
        .step(0.01)
        .onChange((value: number) => {
          effect.uniforms['_Contrast'].value = value;
        });
    }
  }
  /**
   * 创建辉光
   * @param option
   */
  initBloom(option: k3d.BloomParameters) {
    console.log('Bloom');
    if (!this.effectComposer) this.initComposer();
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(option.width || this.width, option.height || this.height),
      option.strength,
      option.radius,
      option.threshold
    );
    this.effectComposer.addPass(unrealBloomPass);
    if (option.gui && this.gui) {
      const Bloomgui = this.gui.addFolder('Bloom');
      Bloomgui.add(unrealBloomPass, 'strength', 0).step(0.001);
      Bloomgui.add(unrealBloomPass, 'radius', 0).step(0.0001);
      Bloomgui.add(unrealBloomPass, 'threshold', 0).step(0.001);
    }
  }
  /**
   * 添加辉光物体
   */
  addBloom(object: THREE.Object3D<THREE.Event>) {
    if (!this.finalComposer) this.initFinalComposer();
    object.layers.enable(this.BLOOM_SCENE);
  }
  /**
   * 切换添加辉光物体
   */
  toggleBloom(object: THREE.Object3D<THREE.Event>) {
    object.layers.toggle(this.BLOOM_SCENE);
  }
  // 创建部分辉光正常渲染的后期
  initFinalComposer() {
    // 产生辉光的后期
    if (!this.effectComposer) this.initComposer();
    // 产生辉光的后期不渲染到屏幕
    this.effectComposer.renderToScreen = false;
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(this.BLOOM_SCENE);
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
    this.finalComposer = new EffectComposer(this.render);
    this.finalComposer.setPixelRatio(window.devicePixelRatio);
    this.finalComposer.setSize(this.width, this.height);
    this.finalComposer.addPass(this.renderScene);
    this.finalComposer.addPass(finalPass);
  }

  /**
   * 创建景深
   * @param option
   */
  initDof(option: k3d.DofParameter) {
    const bokehPass = new BokehPass(this.scene, this.camera, {
      focus: option.focus || 1.0,
      aperture: option.aperture || 0.025,
      maxblur: option.maxblur || 0.01,
    });
    this.effectComposer.addPass(bokehPass);

    if (option.gui) {
      const dofGui = this.gui.addFolder('dof');
      if (!option.focus) option.focus = 1.0;
      if (!option.aperture) option.aperture = 0.025;
      if (!option.maxblur) option.maxblur = 0.01;
      dofGui
        .add(option, 'focus')
        .step(0.01)
        .onChange((val) => {
          bokehPass.uniforms['focus'].value = val;
        });
      dofGui
        .add(option, 'aperture')
        .step(0.0001)
        .onChange((val) => {
          bokehPass.uniforms['aperture'].value = val;
        });
      dofGui
        .add(option, 'maxblur')
        .step(0.001)
        .onChange((val) => {
          bokehPass.uniforms['maxblur'].value = val;
        });
    }
  }
  /**
   * 描边效果
   */
  initOutLine(config: k3d.OutLineParameters) {
    if (!this.effectComposer) this.initComposer();
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
    for (const key in config) {
      if (hasOwnProperty.call(config, key) && _.hasOwnProperty.call(this.outlinePass, key)) {
        if (['visibleEdgeColor', 'hiddenEdgeColor'].includes(key))
          this.outlinePass[key].set(config[key]); // 设置显示的颜色
        else (this.outlinePass as obj)[key] = config[key];
      }
    }
    this.effectComposer.addPass(this.outlinePass);
  }
  // 重写Set的Add和delete方法
  rewriteSet(set, func) {
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
   * 点击拾取
   */
  bindEvent() {
    const render = this.css3dRenderer || this.css2dRenderer || this.render;
    // 模拟点击事件
    render.domElement.onmousedown = () => {
      const _this = this;
      // 当按下,绑定鼠标放开事件
      render.domElement.onmouseup = function (event: MouseEvent) {
        _this.emit({
          type: 'click',
          event: _this.getSelectObject(event),
        });
        console.log(event);
        _this.timeRender();
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
        this.emit({
          type: 'hover',
          event: mode,
        });
        this.timeRender();
      }, 150)
    );
  }
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
   * 窗口变化执行，可被重写
   * @param config 相机的默认参数
   */
  onresize(config: obj) {
    this.width = this.domElement?.clientWidth || window.innerWidth;
    this.height = this.domElement?.clientHeight || window.innerHeight;
    if ((this.camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const {
        left = this.width / -2,
        right = this.width / 2,
        top = this.height / 2,
        bottom = this.height / -2,
      } = config;
      (this.camera as THREE.OrthographicCamera).left = left;
      (this.camera as THREE.OrthographicCamera).right = right;
      (this.camera as THREE.OrthographicCamera).top = top;
      (this.camera as THREE.OrthographicCamera).bottom = bottom;
    } else {
      const { aspect = this.width / this.height } = config;
      (this.camera as THREE.PerspectiveCamera).aspect = aspect;
    }
    this.camera.updateProjectionMatrix();
    if (this.outlinePass) this.outlinePass.resolution = new THREE.Vector2(this.width, this.height);

    this.effectComposer && this.effectComposer.setSize(this.width, this.height);
    this.finalComposer && this.finalComposer.setSize(this.width, this.height);
    this.render.setSize(this.width, this.height);
    this.css2dRenderer && this.css2dRenderer.setSize(this.width, this.height);
    this.css3dRenderer && this.css3dRenderer.setSize(this.width, this.height);
    this.timeRender();
  }
  // 更新渲染并在time后停止
  timeRender(time = 3000) {
    if (this.timeRenderTimer || this.renderEnabled) return;
    this.timeRenderTimer = window.setTimeout(() => {
      clearTimeout(this.timeRenderTimer);
      this.timeRenderTimer = null;
    }, time);
    this.animate();
  }
  // 截屏
  screenCapture() {
    this.render.render(this.scene, this.camera as THREE.Camera);
    const herf = this.render.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = Date.now() + '.png';
    a.href = herf;
    a.click();
  }
  /**
   * 更新渲染
   */
  animate() {
    if ((this.renderEnabled || this.timeRenderTimer) && this.domElement) requestAnimationFrame(() => this.animate());
    this.emit('loop');
    if (this.stats) this.stats.update();
    const delta = this.clock.getDelta();
    if (this.controls) this.controls.update();
    // 如果有后期，刷新后期处理的渲染
    if (this.effectComposer) {
      // 如果有部分辉光
      if (this.finalComposer) this.bloomAnimate();
      else this.effectComposer.render(delta);
    } else this.render.render(this.scene, this.camera);
    this.css2dRenderer && this.css2dRenderer.render(this.scene, this.camera);
    this.css3dRenderer && this.css3dRenderer.render(this.scene, this.camera);
    for (const iterator of this.mixers) {
      iterator.update(delta);
    }
    this.TWEEN.update();
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
  dispose() {
    this.domElement = null;
    this.scene.traverse((child: any) => {
      child.dispose && child.dispose();
    });
  }
}
export default K3d;
