import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
/**
 * 抗锯齿(后期处理)
 * @param way
 * @default fxaa
 * ssaa 抗锯齿效果是最好的，但是性能最差
 * smaa 性能略好,比较吃显存
 * fxaa 性能开销很小，但是效果很一般，特别是细线的锯齿没法解决，转动摄影机边缘的闪动效果也无法解决,画面模糊
 */
type Way = "fxaa" | "smaa" | "ssaa";
export default class ClearAntialias {
  way!: Way;
  domElement!: HTMLElement;
  renderer!: THREE.WebGLRenderer;
  renderPass!: RenderPass;
  effectComposer!: EffectComposer;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  pass!: ShaderPass | SMAAPass | SSAARenderPass;
  constructor(
    way: Way,
    domElement: HTMLElement,
    renderer: THREE.WebGLRenderer,
    renderPass: RenderPass,
    effectComposer: EffectComposer,
    /**
     * ssaa 必传
     */
    scene?: THREE.Scene,
    /**
     * ssaa 必传
     */
    camera?: THREE.PerspectiveCamera
  ) {
    this.way = way;
    this.domElement = domElement;
    this.renderer = renderer;
    this.renderPass = renderPass;
    this.effectComposer = effectComposer;
    if (scene) this.scene = scene;
    if (camera) this.camera = camera;
    this.pass = this[way]();
  }
  fxaa() {
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();

    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (this.domElement.clientWidth * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (this.domElement.clientHeight * pixelRatio);
    this.effectComposer.addPass(fxaaPass);
    return fxaaPass;
  }
  smaa() {
    const pixelRatio = this.renderer.getPixelRatio();
    const pass = new SMAAPass(
      this.domElement.clientWidth * pixelRatio,
      this.domElement.clientWidth * pixelRatio
    );
    this.effectComposer.addPass(pass);
    return pass;
  }
  ssaa() {
    this.effectComposer.setPixelRatio(1); // ensure pixel ratio is always 1 for performance reasons
    const ssaaRenderPass = new SSAARenderPass(this.scene!, this.camera!);
    this.effectComposer.addPass(ssaaRenderPass);
    return ssaaRenderPass;
  }
  dispose() {
    this.effectComposer.setPixelRatio(window.devicePixelRatio);
    this.effectComposer.removePass(this.pass);
  }
}
