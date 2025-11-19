/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 定义一套马卡龙色系/多巴胺配色
        'candy-red': '#FF6B6B',
        'candy-orange': '#FF9F43',
        'candy-yellow': '#FECA57',
        'candy-green': '#1DD1A1',
        'candy-blue': '#54A0FF',
        'candy-purple': '#5F27CD',
        'paper-white': '#F7F1E3',
        'dark-text': '#2C3A47',
      },
      fontFamily: {
        // 适合中文显示的圆体推荐，如果没有本地字体会回退
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
        cartoon: ['"YouYuan"', '"HanyiSenty"', 'cursive'], // 如果有卡通字体可配置在这里
      },
      animation: {
        'bounce-sm': 'bounce-sm 0.5s infinite',
      },
      keyframes: {
        'bounce-sm': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}