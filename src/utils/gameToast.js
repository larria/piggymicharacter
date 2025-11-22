import { reactive } from 'vue';

// 响应式状态
export const toastState = reactive({
  show: false,
  message: '',
  type: 'info', // 'info' | 'success' | 'warning' | 'error'
  duration: 2000
});

let timer = null;

/**
 * 显示全局 Toast
 * @param {string} message - 显示的文字，支持 \n 换行
 * @param {string} type - 类型：'info' (默认), 'success', 'warning', 'error'
 * @param {number} duration - 持续时间，默认 2500ms
 */
export const showToast = (message, type = 'info', duration = 2500) => {
  // 如果上一个还没结束，先清除定时器
  if (timer) clearTimeout(timer);

  toastState.message = message;
  toastState.type = type;
  toastState.show = true;

  timer = setTimeout(() => {
    toastState.show = false;
    timer = null;
  }, duration);
};