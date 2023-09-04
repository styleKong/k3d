import { AmbientLight, DirectionalLight, HemisphereLight } from 'three'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

type LightType = 'AmbientLight' | 'DirectionalLight' | 'HemisphereLight'
interface Light {
  color?: number | string
  intensity?: number
}
interface DirectionalLightConfig extends Light {
  position: [number, number, number]
}
type AmbientLightConfig = Light
interface HemisphereLightConfig extends Light {
  groundColor?: number | string
  position: [number, number, number]
}
interface LightTypeConfigMapping {
  AmbientLight: AmbientLightConfig
  DirectionalLight: DirectionalLightConfig
  HemisphereLight: HemisphereLightConfig
}
interface LightTypeMapping {
  AmbientLight: AmbientLight
  DirectionalLight: DirectionalLight
  HemisphereLight: HemisphereLight
}
export default function initLight<T extends LightType>(
  scene: THREE.Scene,
  lightType: T,
  config: LightTypeConfigMapping[T],
  gui?: GUI
): LightTypeMapping[T] {
  let light: LightTypeMapping[T]
  if (lightType === 'DirectionalLight') {
    light = new DirectionalLight(config.color, config.intensity) as LightTypeMapping[T]
    light.position.set(...(config as DirectionalLightConfig).position)
  } else if (lightType === 'AmbientLight') {
    light = new AmbientLight(config.color, config.intensity) as LightTypeMapping[T]
  } else {
    light = new HemisphereLight(
      config.color,
      (config as HemisphereLightConfig).groundColor,
      config.intensity
    ) as LightTypeMapping[T]

    light.position.set(...(config as HemisphereLightConfig).position)
  }
  scene.add(light)
  if (gui) {
    const folder = gui.addFolder(lightType)
    folder.addColor(light, 'color')
    folder.add(light, 'intensity').step(0.01)
    if (lightType === 'HemisphereLight') folder.addColor(light, 'groundColor')
    if (lightType !== 'AmbientLight') {
      const folder2 = folder.addFolder('position')
      folder2.add(light.position, 'x').step(0.1)
      folder2.add(light.position, 'y').step(0.1)
      folder2.add(light.position, 'x').step(0.1)
    }
  }
  return light
}
