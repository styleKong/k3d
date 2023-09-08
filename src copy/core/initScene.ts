import { Scene } from 'three'
import _ from 'lodash'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
export default function initScene(
  config?: {
    // 设置背景
    background?: any
    backgroundBlurriness?: number
    environment?: THREE.Texture
    fog?: THREE.Fog
    overrideMaterial?: THREE.Material
  },
  gui?: GUI
): THREE.Scene {
  const scene: THREE.Scene = new Scene()
  if (config)
    for (const key in config) {
      if (_.has(config, key)) {
        ;(scene as Record<string, any>)[key] = (config as Record<string, any>)[key]
      }
    }
  if (gui) {
    const sceneGui = gui.addFolder('scene')
    sceneGui.add(scene, 'backgroundBlurriness').step(0.001)
    sceneGui.addColor(scene, 'background').step(0.001)
  }
  return scene
}
