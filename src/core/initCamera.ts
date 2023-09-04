import { OrthographicCamera, PerspectiveCamera } from 'three'
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
type CameraType = 'PerspectiveCamera' | 'OrthographicCamera'
interface CameraConfig {
  position: [number, number, number]
}
interface CameraTypeMapping {
  PerspectiveCamera: PerspectiveCamera
  OrthographicCamera: OrthographicCamera
}
interface PerspectiveCameraConfig extends CameraConfig {
  fov: number
  aspect: number
  near: number
  far: number
}
interface OrthographicCameraConfig extends CameraConfig {
  left: number
  right: number
  top: number
  bottom: number
  near: number
  far: number
}
interface CameraTypeConfigMapping {
  PerspectiveCamera: PerspectiveCameraConfig
  OrthographicCamera: OrthographicCameraConfig
}
export default function initCamera<T extends CameraType>(
  scene: THREE.Scene,
  cameraType: T,
  config: CameraTypeConfigMapping[T],
  gui?: GUI
): CameraTypeMapping[T] {
  let camera: CameraTypeMapping[T]
  if (cameraType == 'PerspectiveCamera') {
    camera = initPerspectiveCamera(config as PerspectiveCameraConfig, gui) as CameraTypeMapping[T]
  } else {
    camera = initOrthographicCamera(config as OrthographicCameraConfig, gui) as CameraTypeMapping[T]
  }
  scene.add(camera)
  return camera
}

function initPerspectiveCamera(config: PerspectiveCameraConfig, gui?: GUI): PerspectiveCamera {
  const camera = new PerspectiveCamera(config.fov, config.aspect, config.near, config.far)
  camera.position.set(...config.position)
  if (gui) {
    const folder = gui.addFolder('PerspectiveCamera')
    folder.add(camera, 'fov').step(0.01)
    folder.add(camera, 'near').step(0.01)
    folder.add(camera, 'far').step(0.1)
    const folder2 = folder.addFolder('position')
    folder2.add(camera.position, 'x').step(0.1)
    folder2.add(camera.position, 'y').step(0.1)
    folder2.add(camera.position, 'z').step(0.1)
  }
  return camera
}
function initOrthographicCamera(config: OrthographicCameraConfig, gui?: GUI): OrthographicCamera {
  const camera = new OrthographicCamera(
    config.left,
    config.right,
    config.top,
    config.bottom,
    config.near,
    config.far
  )
  camera.position.set(...config.position)
  if (gui) {
    const folder = gui.addFolder('OrthographicCamera')
    folder.add(camera, 'near').step(0.01)
    folder.add(camera, 'far').step(0.1)
    const folder2 = folder.addFolder('position')
    folder2.add(camera.position, 'x').step(0.1)
    folder2.add(camera.position, 'y').step(0.1)
    folder2.add(camera.position, 'z').step(0.1)
  }
  return camera
}
