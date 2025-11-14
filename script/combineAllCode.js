import fs from 'fs';
import path from 'path';

// 存储所有找到的文件路径
const targetFiles = [];

// 兼容ES模块的__filename和__dirname获取（不依赖path.fileURLToPath）
const url = new URL(import.meta.url);
let __filename = url.pathname;
// 处理Windows系统路径（去掉开头的斜杠）
if (process.platform === 'win32') {
  __filename = __filename.slice(1);
}
// 解码URL中的特殊字符（如空格等）
__filename = decodeURIComponent(__filename);
const __dirname = path.dirname(__filename);

/**
 * 深度遍历目录，收集.js、.css和.vue文件
 * @param {string} dir - 要遍历的目录路径
 */
function traverseDir(dir) {
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                traverseDir(fullPath); // 递归遍历子目录
            } else if (file.isFile()) {
                const ext = path.extname(file.name).toLowerCase();
                if (ext === '.js' || ext === '.css' || ext === '.vue') {
                    targetFiles.push(fullPath);
                }
            }
        }
    } catch (err) {
        console.error(`无法访问目录 ${dir}:`, err.message);
    }
}

/**
 * 将收集到的文件内容整合到txt文件
 * @param {string} rootDir - 根目录路径（用于计算相对路径）
 * @param {string} outputFile - 输出文件路径
 */
function combineFiles(rootDir, outputFile) {
    let content = '';
    
    for (const filePath of targetFiles) {
        try {
            const relativePath = path.relative(rootDir, filePath); // 计算相对路径
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            content += `===== ${relativePath} =====\n`;
            content += fileContent;
            content += '\n\n'; // 文件间用空行分隔
        } catch (err) {
            console.error(`无法读取文件 ${filePath}:`, err.message);
        }
    }
    
    try {
        fs.writeFileSync(outputFile, content, 'utf8');
        console.log(`成功将 ${targetFiles.length} 个文件整合到 ${outputFile}`);
    } catch (err) {
        console.error(`无法写入输出文件 ${outputFile}:`, err.message);
    }
}

// 主函数
function main() {
    // 固定输入路径为 ../src（相对于当前脚本所在目录）
    const inputPath = '../src';
    const rootDir = path.resolve(__dirname, inputPath); // 基于脚本目录解析绝对路径
    
    // 检查输入路径是否存在
    if (!fs.existsSync(rootDir)) {
        console.error(`输入路径不存在: ${rootDir}`);
        process.exit(1);
    }
    
    // 检查输入路径是否为目录
    const stats = fs.statSync(rootDir);
    if (!stats.isDirectory()) {
        console.error(`输入路径不是目录: ${rootDir}`);
        process.exit(1);
    }
    
    // 输出路径为脚本同级目录下的 combined_files.txt
    const outputFile = path.join(__dirname, 'combined_files.txt');
    
    console.log(`开始遍历目录: ${rootDir}`);
    traverseDir(rootDir);
    
    if (targetFiles.length === 0) {
        console.log('没有找到.js、css或.vue文件');
        process.exit(0);
    }
    
    console.log(`找到 ${targetFiles.length} 个文件，开始整合...`);
    combineFiles(rootDir, outputFile);
}

// 执行主函数
main();