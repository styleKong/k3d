import { Layers, ShaderMaterial, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const BLOOM_SCENE = Math.floor(Math.random())
export default class FinalComposer {
  scene!: THREE.Scene
  unrealBloomPass!: UnrealBloomPass
  effectComposer!: EffectComposer
  finalComposer!: EffectComposer
  renderer!: WebGLRenderer
  renderPass!: RenderPass
  bloomLayer!: Layers
  domElement!: HTMLElement
  materials: { [key: string]: THREE.Material } = {}
  darkMaterials: { [key: string]: THREE.Material } = {}
  constructor(
    scene: THREE.Scene,
    unrealBloomPass: UnrealBloomPass,
    effectComposer: EffectComposer,
    renderer: WebGLRenderer,
    renderPass: RenderPass,
    domElement?: HTMLElement
  ) {
    this.effectComposer = effectComposer
    this.renderer = renderer
    this.renderPass = renderPass
    this.domElement = domElement || renderer.domElement
  }
  create() {
    // 产生辉光的后期不渲染到屏幕
    this.effectComposer.renderToScreen = false
    this.bloomLayer = new Layers()
    this.bloomLayer.set(BLOOM_SCENE)
    const finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.effectComposer.renderTarget2.texture }
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
        defines: {}
      }),
      'baseTexture'
    )
    finalPass.needsSwap = true
    this.finalComposer = new EffectComposer(this.renderer)
    this.finalComposer.setPixelRatio(window.devicePixelRatio)
    this.finalComposer.setSize(this.domElement.clientWidth, this.domElement.clientWidth)
    this.finalComposer.addPass(this.renderPass)
    this.finalComposer.addPass(finalPass)
  }
  add(object: THREE.Object3D<THREE.Event>) {
    object.layers.enable(BLOOM_SCENE)
  }

  /**
   * 部分辉光执行
   */
  bloomAnimate() {
    // 1. 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
    this.scene.traverse((obj: THREE.Object3D<THREE.Event>) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const material: THREE.Material = (obj as THREE.Mesh).material as THREE.Material
      if (material && this.bloomLayer.test(obj.layers) === false) {
        this.materials[obj.uuid] = material
        if (!this.darkMaterials[material.type]) {
          const Proto = Object.getPrototypeOf(material).constructor
          this.darkMaterials[material.type] = new Proto({ color: 0x000000 })
        }
        ;(obj as THREE.Mesh).material = this.darkMaterials[material.type]
      }
    })
    // 2. 用 bloomComposer 产生辉光
    this.effectComposer.render()
    // 3. 将转成黑色材质的物体还原成初始材质
    this.scene.traverse((obj: THREE.Object3D<THREE.Event>) => {
      if (this.materials[obj.uuid]) {
        ;(obj as THREE.Mesh).material = this.materials[obj.uuid]
        delete this.materials[obj.uuid]
      }
    })
    // 4. 用 finalComposer 作最后渲染
    this.finalComposer.render()
  }
}
