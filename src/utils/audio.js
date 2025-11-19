import { Howl } from 'howler';

// 导入资源路径 (Vite 会处理路径)
import sfxClickUrl from '@/assets/audio/sfx_click.mp3';
import sfxCorrectUrl from '@/assets/audio/sfx_correct.mp3';
import sfxWrongUrl from '@/assets/audio/sfx_wrong.mp3';
import sfxUnlockUrl from '@/assets/audio/sfx_unlock.mp3';
import sfxCelebrateUrl from '@/assets/audio/sfx_celebrate.mp3';
import bgmMainUrl from '@/assets/audio/bgm_main.mp3';

const sounds = {
  click: new Howl({ src: [sfxClickUrl], volume: 0.5 }),
  correct: new Howl({ src: [sfxCorrectUrl], volume: 0.6 }),
  wrong: new Howl({ src: [sfxWrongUrl], volume: 0.6 }),
  unlock: new Howl({ src: [sfxUnlockUrl], volume: 0.7 }),
  celebrate: new Howl({ src: [sfxCelebrateUrl], volume: 0.6 }),
};

const bgm = new Howl({
  src: [bgmMainUrl],
  html5: true, // BGM 使用 HTML5 Audio 以支持大文件流式播放
  loop: true,
  volume: 0.3,
  autoplay: false,
});

export const audioManager = {
  play(name) {
    if (sounds[name]) {
      sounds[name].play();
    }
  },

  // iOS 需要用户交互后才能播放声音，通常在 App.vue 的第一次点击事件中调用此方法
  initAudioContext() {
    if (Howler.ctx && Howler.ctx.state !== 'running') {
      Howler.ctx.resume();
    }
  },

  playBgm() {
    if (!bgm.playing()) {
      bgm.play();
    }
  },

  stopBgm() {
    bgm.stop();
  },

  // 调整 BGM 音量 (例如 TTS 播放时降低背景音)
  setBgmVolume(vol) {
    bgm.fade(bgm.volume(), vol, 500);
  }
};