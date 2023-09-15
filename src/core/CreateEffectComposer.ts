import { Camera, Color, Layers, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';

export default class CreateEffectComposer {
  scene: Scene;
  camera: Camera;
  renderer: WebGLRenderer;
  effectComposer: EffectComposer;
  renderPass: RenderPass;
  bokehPass?: BokehPass;
  outlinePass?: OutlinePass;
  unrealBloomPass?: UnrealBloomPass;
  bloomLayer?: Layers;
  BLOOM_SCENE: 2;
  finalComposer: EffectComposer;
  materials: THREE.Material[];
  darkMaterials: THREE.Material[];
  resources: any[];
  constructor(scene: Scene, camera: Camera, renderer: WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.renderPass = this.track(new RenderPass(scene, camera));
    this.effectComposer = this.track(new EffectComposer(renderer));
    this.effectComposer.addPass(this.renderPass);
    const gammaPass = this.track(new ShaderPass(GammaCorrectionShader));
    this.effectComposer.addPass(gammaPass);
    window.addEventListener('resize', this.onResize);
  }

  track(object) {
    if (object.dispose) this.resources.push(object);
    return object;
  }

  /**
   * 创建景深
   * @param option {@link k3d.DofParameter}
   * @returns Promise<BokehPass>
   */
  addDof(option: { focus: number; aperture: number; maxblur: number }, gui: GUI): BokehPass {
    const bokehPass = this.track(
      new BokehPass(this.scene, this.camera, {
        focus: option.focus || 1.0,
        aperture: option.aperture || 0.025,
        maxblur: option.maxblur || 0.01,
      })
    );
    if (gui) {
      let folder = gui.addFolder('dof');
      folder.add(bokehPass, 'focus').step(0.001);
      folder.add(bokehPass, 'aperture').step(0.001);
      folder.add(bokehPass, 'maxblur').step(0.001);
    }
    this.effectComposer.addPass(bokehPass);
    this.bokehPass = bokehPass;
    return bokehPass;
  }
  /**
   * 添加描边效果
   * @param config
   * @param gui
   * @returns
   */
  addOutline(
    config?: {
      /**
       * 描边厚度
       */
      edgeThickness?: number;
      /**
       * 描边颜色
       */
      visibleEdgeColor?: Color;
      /**
       * 通过发光强度，可以让描边更清晰
       */
      edgeStrength?: number;
      hiddenEdgeColor?: Color;
      /**
       * 控制闪烁,默认0不闪烁
       */
      pulsePeriod?: number;
    },
    gui?: GUI
  ): OutlinePass {
    this.outlinePass = this.track(
      new OutlinePass(
        new Vector2(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight),
        this.scene,
        this.camera
      )
    );
    if (config?.edgeThickness) this.outlinePass.edgeThickness = config.edgeThickness;
    if (config?.visibleEdgeColor) this.outlinePass.visibleEdgeColor = config.visibleEdgeColor;
    if (config?.edgeStrength) this.outlinePass.edgeStrength = config.edgeStrength;
    if (config?.pulsePeriod) this.outlinePass.pulsePeriod = config.pulsePeriod;
    if (config?.hiddenEdgeColor) {
      this.outlinePass.hiddenEdgeColor = config?.hiddenEdgeColor; // 设置显示的颜色
    } else this.outlinePass.hiddenEdgeColor.set(0x000000); // 设置显示的颜色
    if (gui) {
      const folder = gui.addFolder('outline');
      folder.add(this.outlinePass, 'edgeThickness').step(0.001);
      folder.addColor(this.outlinePass, 'visibleEdgeColor');
      folder.addColor(this.outlinePass, 'hiddenEdgeColor');
      folder.add(this.outlinePass, 'edgeStrength').step(0.001);
      folder.add(this.outlinePass, 'pulsePeriod').step(0.001);
    }
    this.effectComposer.addPass(this.outlinePass);
    return this.outlinePass;
  }

  /**
   * 滤镜
   * @param brightness
   * @param saturation
   * @param contrast
   * @param gui
   */
  addBSC(brightness: number = 1, saturation: number = 1, contrast: number = 1, gui?: GUI) {
    const BSCShader = {
      uniforms: {
        tDiffuse: { value: null },
        _Brightness: { value: brightness },
        _Saturation: { value: saturation },
        _Contrast: { value: contrast },
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
    const effect = this.track(new ShaderPass(BSCShader));
    this.effectComposer.addPass(effect);
    if (gui) {
      const folder = gui.addFolder('滤镜');
      folder
        .add(BSCShader.uniforms._Brightness, 'value')
        .step(0.001)
        .name('亮度')
        .onChange((value: number) => {
          effect.uniforms['_Brightness'].value = value;
        });
      folder
        .add(BSCShader.uniforms._Saturation, 'value')
        .step(0.001)
        .name('饱和度')
        .onChange((value: number) => {
          effect.uniforms['_Saturation'].value = value;
        });
      folder
        .add(BSCShader.uniforms._Saturation, 'value')
        .step(0.001)
        .name('对比度')
        .onChange((value: number) => {
          effect.uniforms['_Contrast'].value = value;
        });
    }
  }

  addSsaa() {
    this.effectComposer.setPixelRatio(1); // ensure pixel ratio is always 1 for performance reasons
    const ssaaRenderPass = this.track(new SSAARenderPass(this.scene, this.camera));
    this.effectComposer.addPass(ssaaRenderPass);
    return ssaaRenderPass;
  }

  /**
   * 泛光
   * @param strength
   * @param radius
   * @param threshold
   * @param gui
   */
  initBloom(strength: number, radius: number, threshold: number, gui?: GUI) {
    this.unrealBloomPass = this.track(
      new UnrealBloomPass(
        new Vector2(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight),
        strength,
        radius,
        threshold
      )
    );
    this.effectComposer.addPass(this.unrealBloomPass);
    if (gui) {
      const folder = gui.addFolder('bloom');
      folder.add(this.unrealBloomPass, 'strength').step(0.001);
      folder.add(this.unrealBloomPass, 'radius').step(0.001);
      folder.add(this.unrealBloomPass, 'threshold').step(0.001);
    }
    // 产生辉光的后期不渲染到屏幕
    this.effectComposer.renderToScreen = false;
    this.bloomLayer = this.track(new Layers());
    this.bloomLayer.set(this.BLOOM_SCENE);
    const finalPass = this.track(
      new ShaderPass(
        new ShaderMaterial({
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
      )
    );
    finalPass.needsSwap = true;
    this.finalComposer = this.track(new EffectComposer(this.renderer));
    this.finalComposer.setPixelRatio(window.devicePixelRatio);
    this.finalComposer.setSize(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight);
    this.finalComposer.addPass(this.renderPass);
    this.finalComposer.addPass(finalPass);
  }
  addBloom(object: THREE.Object3D<THREE.Event>) {
    if (!this.unrealBloomPass) throw new Error('请先执行initBloom方法');
    object.layers.enable(this.BLOOM_SCENE);
  }

  onResize: () => void = () => {
    let { offsetWidth, offsetHeight } = this.renderer.domElement;
    if (this.outlinePass) this.outlinePass.resolution = new Vector2(offsetWidth, offsetHeight);
    this.effectComposer && this.effectComposer.setSize(offsetWidth, offsetHeight);
    this.finalComposer && this.finalComposer.setSize(offsetWidth, offsetHeight);
  };

  render() {
    if (this.unrealBloomPass) {
      // 1. 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
      this.scene.traverse((obj: THREE.Object3D<THREE.Event>) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const material: THREE.Material = (obj as THREE.Mesh).material as THREE.Material;
        if (material && this.bloomLayer.test(obj.layers) === false) {
          this.materials[obj.uuid] = material;
          if (!this.darkMaterials[material.type]) {
            const Proto = Object.getPrototypeOf(material).constructor;
            this.darkMaterials[material.type] = new Proto({ color: 0x000000 });
          }
          (obj as THREE.Mesh).material = this.darkMaterials[material.type];
        }
      });
      // 2. 用 bloomComposer 产生辉光
      this.effectComposer.render();
      // 3. 将转成黑色材质的物体还原成初始材质
      this.scene.traverse((obj: THREE.Object3D<THREE.Event>) => {
        if (this.materials[obj.uuid]) {
          (obj as THREE.Mesh).material = this.materials[obj.uuid];
          delete this.materials[obj.uuid];
        }
      });
      // 4. 用 finalComposer 作最后渲染
      this.finalComposer.render();
    } else this.effectComposer.render();
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.resources.forEach((item) => {
      item.dispose();
    });
  }
}
