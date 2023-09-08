const container = document.body;
container.style.width = '100%';
container.style.height = '100vh';

import initRender from '../src copy/core/initRender';
import ResourceTracker from './core/ResourceTracker';
import initCamera from './core/initCamera';
import initControls from './core/initControls';
import initLight from './core/initLight';
import initRenderer from './core/initRenderer';
import initScene from './core/initScene';
const tracker = new ResourceTracker(container);

const scene = tracker.track(initScene());
const camera = tracker.track(
  initCamera(scene, 'PerspectiveCamera', {
    far: 70,
    aspect: window.innerWidth / window.innerHeight,
    near: 1,
    fov: 1000,
    position: [0, 0, 5],
  })
);
const light = tracker.track(
  initLight(scene, 'AmbientLight', {
    color: 0xffffff,
    intensity: 2,
  })
);
const renderer = tracker.track(initRenderer(container, { alpha: true }));
const controls = tracker.track(initControls(camera, renderer));
