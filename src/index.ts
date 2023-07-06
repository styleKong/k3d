import webgl_animation_keyframes from './examples/webgl_animation_keyframes';
import webgl_animation_skinning_blending from './examples/webgl_animation_skinning_blending';
import webgl_animation_skinning_additive_blending from './examples/webgl_animation_skinning_additive_blending';
import webgl_postprocessing_dof from './examples/webgl_postprocessing_dof';
import webgl_postprocessing_unreal_bloom from './examples/webgl_postprocessing_unreal_bloom';
import webgl_postprocessing_unreal_bloom_selective from './examples/webgl_postprocessing_unreal_bloom_selective';
// webgl_postprocessing_unreal_bloom_selective(document.body);
document.body.style.width = '100%';
document.body.style.height = '100vh';
document.body.style.display = 'flex';
document.body.style.margin = '0';
const list = [
  {
    initk3d: webgl_animation_keyframes,
    name: 'webgl_animation_keyframes',
  },
  {
    initk3d: webgl_animation_skinning_blending,
    name: 'webgl_animation_skinning_blending',
  },
  {
    initk3d: webgl_animation_skinning_additive_blending,
    name: 'webgl_animation_skinning_additive_blending',
  },
  {
    initk3d: webgl_postprocessing_dof,
    name: 'webgl_postprocessing_dof',
  },
  {
    initk3d: webgl_postprocessing_unreal_bloom,
    name: 'webgl_postprocessing_unreal_bloom',
  },
  {
    initk3d: webgl_postprocessing_unreal_bloom_selective,
    name: 'webgl_postprocessing_unreal_bloom_selective',
  },
];
const ul = document.createElement('ul');
ul.style.width = '200px';
ul.style.height = '100%';
ul.style.overflowY = 'auto';
ul.style.margin = '0';
ul.style.padding = '0';
const container = document.createElement('div');
container.style.height = '100%';
container.style.flex = '1';
container.style.margin = '0';
document.body.append(ul);
document.body.append(container);
let k3d;
for (let index = 0; index < list.length; index++) {
  const li = document.createElement('li');
  li.style.margin = '0';
  li.style.fontSize = '14px';
  li.style.listStyle = 'none';
  li.style.height = '32px';
  li.style.lineHeight = '32px';
  li.style.textOverflow = 'ellipsis';
  li.style.whiteSpace = 'nowrap';
  li.style.overflow = 'hidden';

  li.setAttribute('data-index', index.toString());
  li.setAttribute('title', list[index].name);
  if (index === 1) {
    li.style.color = 'red';
    k3d = list[index].initk3d(container);
  }
  li.onclick = function (ev) {
    let index: number = Number((ev.target as HTMLElement).getAttribute('data-index'));
    ul.querySelectorAll('li').forEach((label) => {
      if (label !== li) label.style.color = '#000000';
      else li.style.color = 'red';
    });
    container.innerHTML = '';
    if (k3d) k3d.dispose();
    k3d = list[index].initk3d(container);
    console.log(k3d);
  };
  li.textContent = list[index].name;
  ul.append(li);
}
