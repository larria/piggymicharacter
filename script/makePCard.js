import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname 的等效值
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态导入 sharp
let sharp;
try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
} catch (error) {
    console.error('错误：请先安装 sharp 依赖');
    console.log('运行命令: npm install sharp');
    process.exit(1);
}

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.bmp'];

async function processImages(directoryPath) {
    try {
        if (!fs.existsSync(directoryPath)) {
            console.error('错误：目录不存在');
            return;
        }

        const stats = fs.statSync(directoryPath);
        if (!stats.isDirectory()) {
            console.error('错误：提供的路径不是目录');
            return;
        }

        console.log(`开始处理目录: ${directoryPath}`);
        
        let processedCount = 0;
        let errorCount = 0;
        let fileCounter = 1;

        async function walkDir(currentPath) {
            const items = fs.readdirSync(currentPath);
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    await walkDir(fullPath);
                } else if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    
                    if (SUPPORTED_FORMATS.includes(ext)) {
                        try {
                            await convertImage(fullPath, fileCounter, directoryPath);
                            processedCount++;
                            console.log(`✓ 已处理: ${item} -> c${fileCounter}.jpg`);
                            fileCounter++;
                        } catch (error) {
                            errorCount++;
                            console.error(`✗ 处理失败: ${item} - ${error.message}`);
                        }
                    }
                }
            }
        }

        await walkDir(directoryPath);
        
        console.log('\n处理完成！');
        console.log(`成功处理: ${processedCount} 个文件`);
        console.log(`处理失败: ${errorCount} 个文件`);
        
    } catch (error) {
        console.error('处理过程中发生错误:', error.message);
    }
}

async function convertImage(filePath, counter, outputDir) {
    const outputName = `c${counter}.jpg`;
    const outputPath = path.join(outputDir, outputName);
    
    await sharp(filePath)
        .jpeg({ 
            quality: 80,
            mozjpeg: true
        })
        .toFile(outputPath);
}

// 命令行版本主函数
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('使用方法: node img.js <目录路径>');
        console.log('示例: node img.js /path/to/images');
        return;
    }
    
    const directoryPath = args[0];
    processImages(directoryPath);
}

// 如果直接运行此脚本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log('图片转换工具 - 命令行版本');
    console.log('支持格式:', SUPPORTED_FORMATS.join(', '));
    console.log('输出格式: JPG (质量80)');
    console.log('输出命名: c1.jpg, c2.jpg, ...');
    console.log('输出目录: 输入的路径\n');
    
    main();
}