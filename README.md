# K3d

k3d 是对 threejs 得一些常见功能封装，能够快速得搭建场景；  
使用之前，请先安装[threejs](https://www.threejs.org);

**使用说明**  
K3d(domElement,config)

domElement - (参数可选) 场景容器  
config - (参数可选) 当为 Boolean 时 是否开启按需渲染，默认 false 即关闭，当为 Object 时 设置场景

**使用方式一**  
优点： 此方式使用简单快捷，且不需担心内部的异步导致拿不到属性  
缺点： 此方式方式固定，且只能选择 perspectiveCamera 和 orthographicCamera 相机，且只能创建 OrbitControls 控制器；如需添加其他方法，可在 onLoad 回调中或使用方式二  
**注：** 可两种方式结合

```javascript
    new K3d('#container',{
        scene: {
            background: 0xbfe3dd,
            gui: true  // 此参数每个配置项都可设置，为开启参数图形控制GUI
        }
        render: {
            antialias: true,
        },
        perspectiveCamera: {
            near: 1,
            fov: 40,
            far: 100,
            position: [5, 2, 8],
        },
        models: ['./models/gltf/LittlestTokyo.glb'],
        /**
         * 模型加载进度回调
         * @param gltf 模型实例
         */
        onprogress(gltf) {
            gltf.scale.set(0.01, 0.01, 0.01);
            (gltf as any).mixerActions[0].play();
        },
        /**
         * 加载完成回调
         * @param k3d K3d实例
         */
        onLoad(k3d) {
            k3d.renderer.outputEncoding = THREE.sRGBEncoding;
            const pmremGenerator = new THREE.PMREMGenerator(k3d.renderer);
            k3d.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        }
    })
```

**使用方式二**  
优点： 此方式灵活，可自定义多个相机，灯光，控制器等，仅需执行对应得添加方法即可  
缺点： 步骤繁琐，需要注意内部的一些异步方法，需要对 threejs 有一定的掌握 [threejs 官网](https://www.threejs.org)  
**注：** 可两种方式结合

```javascript
 const k3d = new K3d('#container');
  k3d.addScene();
  let camera = k3d.addPerspectiveCamera({
    near: 1,
    fov: 40,
    far: 100,
    position: [5, 2, 8],
    gui: true  // 此参数每个配置项都可设置，为开启参数图形控制GUI
  });
  let renderer = k3d.addRenderer({
    antialias: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  const pmremGenerator = new THREE.PMREMGenerator(k3d.renderer);
  k3d.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  k3d.scene.background = new THREE.Color(0xbfe3dd);
  k3d.addOrbitControls({ gui: true });
  k3d.addStats();
  k3d.modelLoad('./models/gltf/LittlestTokyo.glb').then((gltf) => {
    gltf.scale.set(0.01, 0.01, 0.01);
    (gltf as any).mixerActions[0].play();
  });
  k3d.animate();
```
