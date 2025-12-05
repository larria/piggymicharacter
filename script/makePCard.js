import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取路径上下文
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义关键路径
// 1. 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../');
// 2. 目标资源目录 (src/assets/images/cards)
const TARGET_DIR = path.join(PROJECT_ROOT, 'src/assets/images/cards');

// 动态导入 sharp
let sharp;
try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
} catch (error) {
    console.error('❌ 错误：请先安装 sharp 依赖');
    console.log('👉 运行命令: npm install sharp');
    process.exit(1);
}

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.bmp'];

/**
 * 扫描目标目录，获取当前最大的索引值 (cN.jpg)
 * @returns {number} 当前最大索引，如果没有文件则返回 -1
 */
function getCurrentMaxIndex(dir) {
    if (!fs.existsSync(dir)) return -1;
    
    const files = fs.readdirSync(dir);
    let max = -1;
    // 正则匹配 c0.jpg, c1.jpg, c100.jpg 等
    const regex = /^c(\d+)\.jpg$/i;

    files.forEach(file => {
        const match = file.match(regex);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    });
    return max;
}

/**
 * 主处理函数
 */
async function processImages(sourceDir) {
    // 1. 检查输入参数
    if (!sourceDir) {
        console.error('❌ 错误：请提供包含新图片的[源目录]路径');
        console.log('👉 示例: npm run make-cards ./raw-images');
        return;
    }

    const absSourcePath = path.resolve(process.cwd(), sourceDir);
    
    if (!fs.existsSync(absSourcePath)) {
        console.error(`❌ 源目录不存在: ${absSourcePath}`);
        return;
    }

    // 2. 准备目标环境
    if (!fs.existsSync(TARGET_DIR)) {
        console.log(`📂 创建目标目录: ${TARGET_DIR}`);
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 3. 计算起始索引
    const currentMax = getCurrentMaxIndex(TARGET_DIR);
    let nextIndex = currentMax + 1;

    console.log('========================================');
    console.log(`📂 目标目录: src/assets/images/cards`);
    console.log(`📂 源目录:   ${path.relative(process.cwd(), absSourcePath)}`);
    console.log(`🔢 存量检测: 发现最大索引 c${currentMax}.jpg`);
    console.log(`🚀 新卡片将从 c${nextIndex}.jpg 开始编号`);
    console.log('========================================\n');

    // 4. 读取并处理源文件
    const items = fs.readdirSync(absSourcePath);
    let processedCount = 0;
    let errorCount = 0;

    // 过滤出支持的图片文件
    const validFiles = items.filter(item => {
        const ext = path.extname(item).toLowerCase();
        const fullPath = path.join(absSourcePath, item);
        return fs.statSync(fullPath).isFile() && SUPPORTED_FORMATS.includes(ext);
    });

    if (validFiles.length === 0) {
        console.log('⚠️ 源目录中没有找到支持的图片文件。');
        return;
    }

    for (const item of validFiles) {
        const fullSourcePath = path.join(absSourcePath, item);
        const targetFilename = `c${nextIndex}.jpg`;
        const targetPath = path.join(TARGET_DIR, targetFilename);

        try {
            // 使用 sharp 转换格式并压缩保存
            await sharp(fullSourcePath)
                .jpeg({ 
                    quality: 80, // 保持合理的质量体积比
                    mozjpeg: true 
                })
                .toFile(targetPath);

            console.log(`✅ [${String(nextIndex).padEnd(3)}] ${item} \t---> ${targetFilename}`);
            
            processedCount++;
            nextIndex++;
        } catch (error) {
            console.error(`❌ [ERROR] 处理 ${item} 失败: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n🎉 全部完成！`);
    console.log(`📊 成功生成: ${processedCount} 张`);
    if (errorCount > 0) console.log(`❗ 失败数量: ${errorCount} 张`);
    console.log(`⏭️ 下次生成的起始索引将是: c${nextIndex}`);
}

// 执行脚本
const args = process.argv.slice(2);
processImages(args[0]);