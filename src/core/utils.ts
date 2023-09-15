/** canvas截屏
 * @param {blob} blob canvas.toBlob((bolb) => screenShot(bolb,name))
 */
export const screenShot = (function () {
  const a = document.createElement('a');
  return function saveData(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
  };
})();
/**
 *  动画方法
 * @param {THREE.AnimationAction} action 动画
 * @returns {Object} 返回to方法和setProp方法，可链式调用
 */
export function animateAction(action: THREE.AnimationAction) {
  function loop(fn) {
    if (fn()) requestAnimationFrame(() => loop(fn));
  }
  const fnObj = {
    /**
     *  激活动画，执行开始到结束
     * @param {number} startTime 开始时间 时间线0 - 1
     * @param {number} endTime  结束时间 时间线0 - 1
     * @returns this
     */
    to(startTime, endTime = 1) {
      if (!startTime) {
        if (startTime === 0) action.time = 0;
        else {
          action.timeScale = action.time < (action as any)._clip.duration * endTime ? 1 : -1;
        }
      } else {
        if (startTime < endTime) action.timeScale = 1;
        else action.timeScale = -1;
        action.time = (action as any)._clip.duration * startTime;
      }
      action.paused = false;
      action.play();
      loop(() => {
        let flag = action.time < (action as any)._clip.duration * endTime;
        flag = action.timeScale == -1 ? !flag : flag;
        action.paused = !flag;
        return flag;
      });
      return fnObj;
    },
    /**
     * 设置
     * @param {Function} fn
     * @returns this
     */
    setProp(fn) {
      fn(action);
      return fnObj;
    },
  };
  return fnObj;
}
