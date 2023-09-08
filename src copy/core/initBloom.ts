import { Vector2 } from 'three'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export default function initBloom(
  effectComposer: EffectComposer,
  strength: number,
  radius: number,
  threshold: number,
  domElement: HTMLElement,
  gui?: GUI
) {
  const unrealBloomPass = new UnrealBloomPass(
    new Vector2(domElement.clientWidth, domElement.clientHeight),
    strength,
    radius,
    threshold
  )
  effectComposer.addPass(unrealBloomPass)
  if (gui) {
    const folder = gui.addFolder('bloom')
    folder.add(unrealBloomPass, 'strength').step(0.001)
    folder.add(unrealBloomPass, 'radius').step(0.001)
    folder.add(unrealBloomPass, 'threshold').step(0.001)
  }
  return unrealBloomPass
}
