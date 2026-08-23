const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'node_modules', 'react-native-vision-camera', 'nitrogen', 'generated', 'android', 'kotlin');

if (fs.existsSync(targetDir)) {
  function fixKotlinFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        fixKotlinFiles(fullPath);
      } else if (file.endsWith('.kt')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('protected const val TAG')) {
          content = content.replaceAll('protected const val TAG', 'const val TAG');
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }

  try {
    fixKotlinFiles(targetDir);
    console.log('[FitGO Postinstall] Applied Kotlin companion TAG visibility fix to react-native-vision-camera.');
  } catch (err) {
    console.warn('[FitGO Postinstall] Could not patch react-native-vision-camera:', err.message);
  }
}

// Patch react-native-reanimated fabricUtils.js and fabricUtils.ts for React 19 Fabric
const reanimatedFabricUtilsFiles = [
  path.join(__dirname, '..', 'node_modules', 'react-native-reanimated', 'lib', 'module', 'fabricUtils.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native-reanimated', 'src', 'fabricUtils.ts'),
];

for (const filePath of reanimatedFabricUtilsFiles) {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('getInternalInstanceHandleFromPublicInstance(instance).stateNode.node')) {
        content = content.replace(
          'resolvedRef = getInternalInstanceHandleFromPublicInstance(instance).stateNode.node;',
          'if (instance) { const handle = getInternalInstanceHandleFromPublicInstance(instance) ?? instance?.__internalInstanceHandle ?? instance?._internalInstanceHandle; resolvedRef = handle?.stateNode?.node; }'
        );
        content = content.replace(
          'resolvedRef =\n      getInternalInstanceHandleFromPublicInstance(instance).stateNode.node;',
          'if (instance) { const handle = getInternalInstanceHandleFromPublicInstance(instance) ?? (instance as any)?.__internalInstanceHandle ?? (instance as any)?._internalInstanceHandle; resolvedRef = handle?.stateNode?.node; }'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[FitGO Postinstall] Applied React 19 Fabric stateNode fix to ${path.basename(filePath)}.`);
      }
    } catch (err) {
      console.warn(`[FitGO Postinstall] Could not patch ${path.basename(filePath)}:`, err.message);
    }
  }
}
