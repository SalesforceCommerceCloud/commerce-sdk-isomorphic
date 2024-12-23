const fs = require('fs');
const path = require('path');

/**
 * Recursively collects all file paths in a directory.
 * @param {string} dir - The directory to scan.
 * @param {string} baseDir - The base directory for relative paths.
 * @param {Array<string>} fileList - Array to collect file paths.
 * @returns {Array<string>} The list of file paths.
 */
function getAllFiles(dir, baseDir = dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            getAllFiles(filePath, baseDir, fileList); // Recurse into subdirectory
        } else {
            fileList.push('"src/lib/' + path.relative(baseDir, filePath) + '",'); // Store relative path
        }
    });

    return fileList;
}

// Usage
const targetDir = process.argv[2]; // Directory passed as argument
if (!targetDir) {
    console.error('Please provide a directory path.');
    process.exit(1);
}

try {
    const relativeFilePaths = getAllFiles(targetDir);
    relativeFilePaths.forEach((filePath) => console.log(filePath));
} catch (error) {
    console.error(`Error reading directory: ${error.message}`);
}
