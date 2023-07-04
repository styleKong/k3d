# k3d

## 依赖说明

[threejs](http://www.threejs.org) 是一个三维引擎；通过这个引擎我们可以搭建一个三维场景;

[Tweenjs](https://github.com/tweenjs/tween.js)是一个轻量级的 JavaScript 库，通过这个库可以很容易地实现某个属性在两个值之间进行过渡，而且起始值和结束值之间的所有中间值都会自动计算出来，这个过程叫作 tweening（补间）。

### 安装 three

```
npm install three
```

### 安装 Tween

```
npm install @tweenjs/tween.js
```

## K3d 类说明

本类是针对 threejs 的一个使用封装，其中使用了 Tweenjs 来实现动画过渡

### K3d 使用

```
const k3d = new K3d({
    domElem: '#canvas'
})
```

### option 说明

| param    | type             | required | describe                                                                          |
| -------- | ---------------- | -------- | --------------------------------------------------------------------------------- |
| domElem  | Element\|String  | false    | 放置场景的元素                                                                    |
| scene    | scene            | false    | 场景参数                                                                          |
| camera   | camera           | false    | 摄像机参数 `{perspectiveCamera: {fov: 75,near:.1,far:1000}}`                      |
| light    | light            | false    | 光源参数                                                                          |
| renderer | renderer         | false    | webgl 渲染器参数                                                                  |
| stats    | Boolean          | false    | 帧率显示                                                                          |
| shadow   | shadow           | false    | 阴影                                                                              |
| controls | OrbitControls    | false    | 控制器                                                                            |
| models   | string\|string[] | false    | 需要加载的模型                                                                    |
| onresize | Function         | false    | 重写窗口变化事件，用于初始化 K3d 后更改 camera 属性，避免内部事件影响之后修改的值 |

### scene 场景参数

```
new K3d({
    scene: {
        background: '#000000';
    }
})
```

| param                | type    | required | default | describe                                       |
| -------------------- | ------- | -------- | ------- | ---------------------------------------------- |
| background           | Integer | false    | null    | 场景背景颜色，如是图片视频等，自行使用纹理实现 |
| backgroundBlurriness | Folat   | false    | 0       | 背景模糊度                                     |

### camera 摄像机参数

示例

```
new K3d({
    camera: {
        type: 'perspectiveCamera',
        fov: 75,
        near: .1,
        far: 1000
    }
})
```

| param                                       | type     | required | default           | describe                                                                                                            |
| ------------------------------------------- | -------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| type                                        | string   | false    | perspectiveCamera | perspectiveCamera 透视摄像机配置，用于渲染 3D 场景; orthographicCamera 正交摄像机配置，用于渲染 2D 场景或者 UI 元素 |
| position                                    | number[] | false    | [0,1,0]           | 相机位置                                                                                                            |
| onresize                                    | Function | false    | null              | 重写窗口变化事件，用于初始化 K3d 后更改 camera 属性，避免内部事件影响之后修改的值                                   |
| ...perspectiveCamera\|...orthographicCamera | unkown   | unkown   | unkown            | 其他属性，请见下方各个摄像机的属性                                                                                  |

#### perspectiveCamera 透视摄像机 用于渲染 3D 场景

| param  | type   | required | default        | describe                         |
| ------ | ------ | -------- | -------------- | -------------------------------- |
| fov    | number | false    | 75             | 摄像机视锥体垂直视野角度         |
| aspect | number | false    | width / height | 摄像机视锥体长宽比；非必要，不填 |
| near   | number | false    | 0.1            | 摄像机视锥体近端面               |
| far    | number | false    | 1000           | 摄像机视锥体远端面               |

#### orthographicCamera 正交摄像机 用于渲染 2D 场景或者 UI 元素

| param  | type   | required | default      | describe                         |
| ------ | ------ | -------- | ------------ | -------------------------------- |
| left   | number | false    | width / - 2  | 摄像机视锥体左侧面；非必要，不填 |
| right  | number | false    | width / 2    | 摄像机视锥体右侧面；非必要，不填 |
| top    | number | false    | height / 2   | 摄像机视锥体上侧面；非必要，不填 |
| bottom | number | false    | height / - 2 | 摄像机视锥体下侧面；非必要，不填 |
| near   | number | false    | 1            | 摄像机视锥体近端面               |
| far    | number | false    | 1000         | 摄像机视锥体远端面               |

### light 光源参数

```
new K3d({
    light: {
        directionalLight: {
            color: '0xffffff',
            intensity: 1
        }
    }
})
```

| param            | type             | required | describe                                                         |
| ---------------- | ---------------- | -------- | ---------------------------------------------------------------- |
| ambientLight     | AmbientLight     | false    | 环境光会均匀的照亮场景中的所有物体                               |
| directionalLight | DirectionalLight | false    | 平行光是沿着特定方向发射的光                                     |
| hemisphereLight  | HemisphereLight  | false    | 光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色 |

#### ambientLight 环境光参数

| param     | type    | required | default  | describe        |
| --------- | ------- | -------- | -------- | --------------- |
| color     | Integer | false    | 0xffffff | 颜色的 rgb 数值 |
| intensity | Float   | false    | 1        | 光照的强度      |

#### directionalLight 平行光参数

| param     | type    | required | default  | describe             |
| --------- | ------- | -------- | -------- | -------------------- |
| color     | Integer | false    | 0xffffff | 颜色的 rgb 数值      |
| intensity | Float   | false    | 1        | 光照的强度           |
| position  | Float[] | false    | null     | 光源位置，射向中心点 |
| target    | Float[] | false    | [0,0,0]  | 光源目标位置         |

#### HemisphereLight 半球光参数

| param       | type    | required | default  | describe        |
| ----------- | ------- | -------- | -------- | --------------- |
| skyColor    | Integer | false    | 0xffffff | 颜色的 rgb 数值 |
| groundColor | Integer | false    | 0xffffff | 颜色的 rgb 数值 |
| intensity   | Float   | false    | 1        | 光照的强度      |

### renderer 渲染器参数

```
new K3d({
    renderer: {
        alpha: false,
        antialias: false
    }
})
```

| param     | type    | required | default | describe                |
| --------- | ------- | -------- | ------- | ----------------------- |
| alpha     | Boolean | false    | false   | 控制默认的清除 alpha 值 |
| antialias | Boolean | false    | false   | 是否执行抗锯齿          |

### shadow 阴影参数

```
    new K3d({
        shadow: {
            enabled: true,
        }
    })

```

| param   | type     | required | default | describe     |
| ------- | -------- | -------- | ------- | ------------ |
| enabled | Boolean  | false    | false   | 是否开启阴影 |
| mapSize | number[] | false    | null    | 阴影贴图大小 |
| near    | Float    | false    | .5      | 近截面       |
| far     | Float    | false    | 500     | 远截面       |

### controls 控制器参数

```
    new K3d({
        controls: {
            target: [0, 0, 0],
        }
    })
```

| param           | type      | required | default               | describe                             |
| --------------- | --------- | -------- | --------------------- | ------------------------------------ |
| target          | Float\[\] | false    | \[0,0,0\]             | 控制器的焦点                         |
| autoRotate      | Boolean   | false    | false                 | 开启自动围绕目标旋转                 |
| autoRotateSpeed | Float     | false    | 2.0                   | 围绕目标旋转的速度                   |
| keyPanSpeed     | Float     | false    | 7                     | 当使用键盘按键的时候，相机平移的速度 |
| enableRotate    | Boolean   | false    | true                  | 启用或禁用摄像机水平或垂直旋转       |
| azimuthAngle    | Float\[\] | false    | \[Infinity,Infinity\] | 水平旋转的角度范围                   |
| polarAngle      | Float\[\] | false    | \[Infinity,Infinity\] | 垂直旋转的角度范围                   |
| enablePan       | Boolean   | false    | true                  | 启用或禁用摄像机平移                 |
| distance        | Float\[\] | false    | \[Infinity,Infinity\] | 相机向外移动范围                     |
| enableZoom      | Boolean   | false    | true                  | 启用或禁用摄像机的缩放               |
| zoom            | Float\[\] | false    | \[Infinity,Infinity\] | 相机缩放范围                         |

## k3d 实例属性说明

| param       | type                                                | describe                                                   |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------- |
| domElem     | HTMLElement                                         | 放置场景的元素                                             |
| scene       | THREE.Scene                                         | 场景实例                                                   |
| camera      | THREE.PerspectiveCamera \| THREE.OrthographicCamera | 摄像机实例                                                 |
| renderer    | THREE.WebGLRenderer                                 | 渲染实例                                                   |
| light       | THREE.DirectionalLight                              | 平行光实例                                                 |
| lightTarget | THREE.Object3D                                      | 平行光实例目标对象，通过修改该对象的位置实现修改光的目标点 |
| hemisphere  | THREE.HemisphereLight                               | 半球光实例                                                 |
