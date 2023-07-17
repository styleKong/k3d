declare namespace k3d {
  type url = string;
  type color = string | number;
  interface camera {
    type?: 'PerspectiveCamera' | 'OrthographicCamera';
    /**
     * 摄像机视锥体近端面
     * @default 1
     */
    near?: number;
    /**
     * 摄像机视锥体远端面
     * @default 1000
     */
    far?: number;
    /**
     * 摄像机的缩放倍数
     * @default 1
     */
    zoom?: number;
    /**
     * 摄像机位置
     * @default [0,0,0]
     */
    position?: numberArray3;
    /**
     * 摄像机目标位置
     * @default [0,0,0]
     */
    target?: numberArray3;
    gui?: boolean;
  }
  interface OrthographicCameraParameters extends camera {
    offset?: number;
  }
  interface PerspectiveCameraParameters extends camera {
    /**
     * 摄像机视锥体垂直视野角度
     * 取值范围[1-90]
     * @default 50
     */
    fov?: number;
    /**
     * 摄像机视锥体的长宽比 画布的宽/画布的高
     */
    aspect?: number;
    /**
     * 用于立体视觉和景深效果的物体的距离
     * @default 10
     */
    focus?: number;
  }

  interface CubeCameraParameters {
    near?: number;
    far?: number;
    renderTarget?: THREE.WebGLCubeRenderTarget;
    gui?: boolean;
  }

  interface light {
    color?: color;
    intensity?: number;
    position?: numberArray3;
    gui?: boolean;
  }

  interface DirectionalLightParameters extends light {
    target?: numberArray3;
  }

  interface HemisphereLightParameters extends light {
    groundColor?: color;
  }
  interface PointLightParameters extends light {
    distance?: number;
    decay?: number;
  }
  interface RectAreaLightParameters extends light {
    width?: number;
    height?: number;
  }
  interface SpotLightParameters extends light {
    distance?: number;
    angle?: number;
    penumbra?: number;
    decay?: number;
    target?: numberArray3;
  }
  export type numberArray3 = [number, number, number];
  /**
   * 该对象的属性定义了渲染器的行为
   * {@link THREE.WebGLRendererParameters}
   */
  export interface WebGLRendererParameters extends THREE.WebGLRendererParameters {
    toneMapping?: THREE.ToneMapping;
    outputColorSpace?: THREE.ColorSpace;
    outputEncoding?: THREE.TextureEncoding;
    toneMappingExposure?: number;
    autoClear?: boolean;
    autoClearColor?: boolean;
    autoClearDepth?: boolean;
    autoClearStencil?: boolean;
    localClippingEnabled?: boolean;
    clippingPlanes?: number[];
    useLegacyLights?: boolean;
    sortObjects?: boolean;
    gui?: boolean;
  }
  export interface SceneParameters {
    background?: url | color | THREE.Texture;
    backgroundBlurriness?: number;
    environment?: url | THREE.Texture;
    overrideMaterial?: THREE.Material;
    gui?: boolean;
  }
  export type CameraParameters = OrthographicCameraParameters | PerspectiveCameraParameters;
  export interface LightParameters {
    AmbientLight?: light;
    DirectionalLight?: DirectionalLightParameters;
    HemisphereLight?: HemisphereLightParameters;
  }
  export interface ControlsParameters {
    target?: numberArray3;
    /**
     * 将其设为true，以自动围绕目标旋转
     */
    autoRotate?: boolean;
    /**
     * 自动旋转的速度
     * @default 2.0
     */
    autoRotateSpeed?: number;
    /**
     * 将其设为true，以启用阻尼（惯性）
     */
    enableDamping?: boolean;
    /**
     * 阻尼惯性有多大
     * @default 0.05
     */
    dampingFactor?: number;
    /**
     * 当设置为false时，控制器将不会响应用户的操作
     */
    enabled?: boolean;
    /**
     * 启用或禁用摄像机平移
     * @default true
     */
    enablePan?: boolean;
    /**
     * 定义当平移的时候摄像机的位置将如何移动 如果为true，摄像机将在屏幕空间内平移。 否则，摄像机将在与摄像机向上方向垂直的平面中平移
     * @default true
     */
    screenSpacePanning?: boolean;
    /**
     * 位移的速度
     * @default 1
     */
    panSpeed?: number;
    /**
     * 启用或禁用摄像机水平或垂直旋转
     * @default true
     */
    enableRotate?: boolean;
    /**
     * 旋转的速度
     * @default 1
     */
    rotateSpeed?: number;
    /**
     * 启用或禁用摄像机的缩放
     * @default true
     */
    enableZoom?: boolean;
    /**
     * 摄像机缩放的速度
     * @default 1
     */
    zoomSpeed?: number;
    /**
     * 你能够水平旋转的角度上限
     * 取值范围 [-2 * Math.PI，2 * Math.PI]
     * @default infinity
     */
    maxAzimuthAngle?: number;
    /**
     * 你能够水平旋转的角度下限
     * 取值范围 [-2 * Math.PI，2 * Math.PI]
     * @default infinity
     */
    minAzimuthAngle?: number;
    /**
     * 你能够垂直旋转的角度上限
     * 取值范围 [0，Math.PI]
     * @default Math.PI
     */
    maxPolarAngle?: number;
    /**
     * 你能够垂直旋转的角度下限
     * 取值范围 [0，Math.PI]
     * @default 0
     */
    minPolarAngle?: number;
    /**
     * 你能够将相机向外移动多少（仅适用于PerspectiveCamera）
     * @default infinity
     */
    maxDistance?: number;
    /**
     * 你能够将相机向内移动多少（仅适用于PerspectiveCamera）
     * @default 0
     */
    minDistance?: number;
    /**
     * 你能够将相机向外移动多少（仅适用于OrthographicCamera）
     * @default infinity
     */
    maxZoom?: number;
    /**
     * 你能够将相机向内移动多少（仅适用于OrthographicCamera）
     * @default 0
     */
    minZoom?: number;
    gui?: boolean;
  }
  export interface FilterParameters {
    /**
     * 亮度
     * @default 1
     */
    brightness: number;
    /**
     * 饱和度
     * @default 1
     */
    saturation: number;
    /**
     * 对比度
     * @default 1
     */
    contrast: number;
    gui?: boolean;
  }
  export interface BloomParameters {
    width?: number;
    height?: number;
    strength: number;
    radius: number;
    threshold: number;
    gui?: boolean;
  }
  export interface OutLineParameters {
    edgeStrength?: number;
    edgeGlow?: number;
    edgeThickness?: number;
    pulsePeriod?: number;
    visibleEdgeColor?: color;
    hiddenEdgeColor?: color;
    usePatternTexture?: boolean;
    gui?: boolean;
  }
  export interface ShadowParameters {
    size?: number;
    near?: number;
    far?: number;
    offset?: number;
    focus?: number;
    gui?: boolean;
  }
  export interface FogParameters {
    color?: color;
    near?: number;
    far?: number;
    gui?: boolean;
  }
  export interface DofParameter {
    focus?: number;
    aperture?: number;
    maxblur?: number;
    gui?: boolean;
  }
}

type k3dParam = {
  domElement?: HTMLElement;
  /**
   *  按需渲染
   * @default false
   */
  renderRequested?: boolean;
  /**
   *  帧率显示
   *  @default false
   */
  stats?: boolean;
  /**
   * 渲染器属性
   * {@link k3d.WebGLRendererParameters}
   */
  render?: k3d.WebGLRendererParameters;

  /**
   * 场景属性
   * {@link k3d.SceneParameters}
   */
  scene?: k3d.SceneParameters;
  sky?: string | string[];
  fog?: k3d.FogParameters;
  perspectiveCamera?: k3d.PerspectiveCameraParameters;
  orthographicCamera?: k3d.OrthographicCameraParameters;
  ambientLight?: { color?: k3d.color; intensity?: number; gui?: boolean };
  directionalLight?: k3d.DirectionalLightParameters;
  hemisphereLight?: k3d.HemisphereLightParameters;
  controls?: k3d.ControlsParameters;
  shadow?: k3d.ShadowParameters;
  dof?: k3d.DofParameter;
  filter?: k3d.FilterParameters;
  models?: string[] | string;
  bloom?: k3d.BloomParameters;
  outline?: k3d.OutLineParameters;
  onLoad?: (scene: any) => void;
  onprogress?: (gltf: THREE.Group | THREE.Mesh) => void;
};
