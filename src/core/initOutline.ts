import _ from 'lodash'
import { Color, Vector2 } from 'three'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
export default function initOutline(
  width: number,
  height: number,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  effectComposer: EffectComposer,
  config?: {
    /**
     * 描边厚度
     */
    edgeThickness?: number
    /**
     * 描边颜色
     */
    visibleEdgeColor?: Color
    /**
     * 通过发光强度，可以让描边更清晰
     */
    edgeStrength?: number
    hiddenEdgeColor?: Color
    /**
     * 控制闪烁,默认0不闪烁
     */
    pulsePeriod?: number
  },
  gui?: GUI
): OutlinePass {
  const outlinePass = new OutlinePass(new Vector2(width, height), scene, camera as THREE.Camera)
  if (config?.edgeThickness) outlinePass.edgeThickness = config.edgeThickness
  if (config?.visibleEdgeColor) outlinePass.visibleEdgeColor = config.visibleEdgeColor
  if (config?.edgeStrength) outlinePass.edgeStrength = config.edgeStrength
  if (config?.pulsePeriod) outlinePass.pulsePeriod = config.pulsePeriod
  if (config?.hiddenEdgeColor) {
    outlinePass.hiddenEdgeColor = config?.hiddenEdgeColor // 设置显示的颜色
  } else outlinePass.hiddenEdgeColor.set(0, 0, 0) // 设置显示的颜色
  if (gui) {
    const folder = gui.addFolder('outline')
    folder.add(outlinePass, 'edgeThickness').step(0.001)
    folder.addColor(outlinePass, 'visibleEdgeColor')
    folder.addColor(outlinePass, 'hiddenEdgeColor')
    folder.add(outlinePass, 'edgeStrength').step(0.001)
    folder.add(outlinePass, 'pulsePeriod').step(0.001)
  }
  effectComposer.addPass(outlinePass)
  return outlinePass
}
