// ===== utils/audio.js =====
import { Howl } from 'howler';
import { ref } from 'vue'; // 【新增】引入 ref

// ... (资源导入保持不变)
import sfxClickUrl from '@/assets/audio/sfx_click.mp3';
import sfxCorrectUrl from '@/assets/audio/sfx_correct.mp3';
import sfxWrongUrl from '@/assets/audio/sfx_wrong.mp3';
import sfxUnlockUrl from '@/assets/audio/sfx_unlock.mp3';
import sfxCelebrateUrl from '@/assets/audio/sfx_celebrate.mp3';
import bgmMainUrl from '@/assets/audio/bgm_main.mp3';

// 【新增】全局导出音频解锁状态，供组件判断是否需要显示“开始”按钮
export const isAudioUnlocked = ref(false);

const sounds = {
  // ... (保持不变)
  click: new Howl({ src: [sfxClickUrl], volume: 0.5 }),
  correct: new Howl({ src: [sfxCorrectUrl], volume: 0.6 }),
  wrong: new Howl({ src: [sfxWrongUrl], volume: 0.6 }),
  unlock: new Howl({ src: [sfxUnlockUrl], volume: 0.7 }),
  celebrate: new Howl({ src: [sfxCelebrateUrl], volume: 0.6 }),
};

const bgm = new Howl({
  // ... (保持不变)
  src: [bgmMainUrl],
  html5: true,
  loop: true,
  volume: 0.3,
  autoplay: false,
});

export const audioManager = {
  play(name) {
    // ... (保持不变)
    if (sounds[name]) {
      sounds[name].play();
    }
  },

  // iOS 需要用户交互后才能播放声音
  initAudioContext() {
    if (Howler.ctx && Howler.ctx.state !== 'running') {
      Howler.ctx.resume();
    }
    // 【新增】标记为已解锁
    isAudioUnlocked.value = true;
  },

  // ... (playBgm, stopBgm, setBgmVolume 保持不变)
  playBgm() {
    if (!bgm.playing()) {
      bgm.play();
    }
  },

  stopBgm() {
    bgm.stop();
  },

  setBgmVolume(vol) {
    bgm.fade(bgm.volume(), vol, 500);
  }
};