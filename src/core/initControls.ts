import _, { floor } from 'lodash';
import { OrthographicCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

export default function initControls(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  renderer: THREE.WebGLRenderer,
  config?: {
    /**
     * 将其设为true，以自动围绕目标旋转。
     */
    autoRotate?: boolean;
    /**
     * 当.autoRotate为true时，围绕目标旋转的速度将有多快
     */
    autoRotateSpeed?: number;
    /**
     * 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感
     */
    enableDamping?: boolean;
    /**
     * 当.enableDamping设置为true的时候，阻尼惯性有多大
     */
    dampingFactor?: number;
    /**
     * 当设置为false时，控制器将不会响应用户的操作
     */
    enabled?: boolean;
    /**
     * 启用或禁用摄像机平移
     */
    enablePan?: boolean;
    /**
     * 启用或禁用摄像机水平或垂直旋转
     */
    enableRotate?: boolean;
    /**
     * 启用或禁用摄像机的缩放
     */
    enableZoom?: boolean;
    /**
     * 当使用键盘按键的时候，相机平移的速度有多快
     */
    keyPanSpeed?: number;
    /**
     * 你能够水平旋转的角度上限
     */
    maxAzimuthAngle?: number;
    /**
     * 你能够将相机向外移动多少（仅适用于PerspectiveCamera）
     */
    maxDistance?: number;
    /**
     * 你能够垂直旋转的角度的上限，范围是0到Math.PI
     */
    maxPolarAngle?: number;
    /**
     * 你能够将相机缩小多少（仅适用于OrthographicCamera）
     */
    maxZoom?: number;
    /**
     * 你能够水平旋转的角度下限。如果设置，其有效值范围为[-2 * Math.PI，2 * Math.PI],且旋转角度的上限和下限差值小于2 * Math.PI
     */
    minAzimuthAngle?: number;
    /**
     * 你能够将相机向内移动多少（仅适用于PerspectiveCamera）
     */
    minDistance?: number;
    /**
     * 你能够垂直旋转的角度的下限，范围是0到Math.PI
     */
    minPolarAngle?: number;
    /**
     * 你能够将相机放大多少（仅适用于OrthographicCamera）
     */
    minZoom?: number;
    /**
     * 位移的速度，其默认值为1。
     */
    panSpeed?: number;
    /**
     * 旋转的速度，其默认值为1。
     */
    rotateSpeed?: number;
    /**
     * 摄像机缩放的速度，其默认值为1。
     */
    zoomSpeed?: number;
    /**
     * 定义当平移的时候摄像机的位置将如何移动
     */
    screenSpacePanning?: boolean;
    /**
     * 控制器的焦点
     */
    target?: [number, number, number];
  },
  gui?: GUI
) {
  const controls = new OrbitControls(camera, renderer.domElement);
  for (const key in config) {
    if (_.has(config, key)) {
      if (key !== 'target') (controls as Record<string, any>)[key] = (config as Record<string, any>)[key];
      else if (config.target) controls.target.set(...config.target);
    }
  }
  if (gui) {
    const folder = gui.addFolder('OrbitControls');
    folder.add(controls, 'autoRotate');
    folder.add(controls, 'autoRotateSpeed').step(0.001);
    folder.add(controls, 'enableDamping');
    folder.add(controls, 'dampingFactor').step(0.001);
    folder.add(controls, 'enabled');
    folder.add(controls, 'enablePan');
    folder.add(controls, 'enableRotate');
    folder.add(controls, 'enableZoom');
    if (camera instanceof OrthographicCamera) {
      folder.add(controls, 'maxZoom').step(0.001);
      folder.add(controls, 'minZoom').step(0.001);
    } else {
      folder.add(controls, 'maxDistance').step(0.001);
      folder.add(controls, 'minDistance').step(0.001);
    }
    folder.add(controls, 'screenSpacePanning');
    folder.add(controls, 'keyPanSpeed').step(0.001);
    folder.add(controls, 'maxAzimuthAngle').step(0.001);
    folder.add(controls, 'minAzimuthAngle').step(0.001);
    folder.add(controls, 'maxPolarAngle').step(0.001);
    folder.add(controls, 'minPolarAngle').step(0.001);
    folder.add(controls, 'panSpeed').step(0.001);
    folder.add(controls, 'rotateSpeed').step(0.001);
    folder.add(controls, 'zoomSpeed').step(0.001);
    const targetGui = folder.addFolder('target');
    targetGui.add(controls.target, 'x').step(0.01);
    targetGui.add(controls.target, 'y').step(0.01);
    targetGui.add(controls.target, 'z').step(0.01);
  }
  return controls;
}
