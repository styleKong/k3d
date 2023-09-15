import * as THREE from 'three';
/**
 * 主要是收集资源&&事件以便释放资源
 */
export default class ResourceTracker {
  resources = new Set();
  /** 释放资源 start */
  /**
   * 资源收集
   * @param resource
   * @returns
   */
  track(resource: any) {
    if (!resource) {
      return resource;
    }
    // handle children and when material is an array of materials.
    if (Array.isArray(resource)) {
      resource.forEach((resource) => this.track(resource));
      return resource;
    }
    if (resource.dispose || resource instanceof THREE.Object3D) {
      this.resources.add(resource);
    }
    if (resource instanceof THREE.Object3D) {
      this.track((resource as THREE.Mesh).geometry);
      this.track((resource as THREE.Mesh).material);
      this.track(resource.children);
    } else if (resource instanceof THREE.Material) {
      // We have to check if there are any textures on the material
      for (const value of Object.values(resource)) {
        if (value instanceof THREE.Texture) {
          this.track(value);
        }
      }
      // We also have to check if any uniforms reference textures or arrays of textures
      if ((resource as THREE.ShaderMaterial).uniforms) {
        for (const value of Object.values((resource as THREE.ShaderMaterial).uniforms)) {
          if (value) {
            const uniformValue = value.value;
            if (uniformValue instanceof THREE.Texture || Array.isArray(uniformValue)) {
              this.track(uniformValue);
            }
          }
        }
      }
    }
    return resource;
  }
  /**
   * 取消资源收集
   * @param resource
   */
  untrack(resource) {
    this.resources.delete(resource);
  }
  /**
   * 释放资源和事件
   */
  dispose() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      }
      if ((resource as any).dispose) {
        (resource as any).dispose();
      }
    }
    this.resources.clear();
  }
  /** 释放资源 end */
}
