'use strict';
// Release packaging only. Keep CommonJS resolution local to the generated ESM loader.
const prefix='// DCS: module-local Node compatibility for bundled CommonJS dependencies.\nimport { createRequire as dcsCreateRequire } from "node:module";\nconst require = dcsCreateRequire("/dcs-runtime.cjs");\n';
function prepareWorkerCommonJsLoader(source){
 if(source.startsWith(prefix))return source;
 if(!source.includes('var __require =')||!source.includes('typeof require !== "undefined"')||!source.includes('Calling `require` for'))throw Error('UNRECOGNISED_COMMONJS_LOADER');
 if(/(?:^|\n)(?:const|let|var) require\s*=|import\s.*\brequire\b/.test(source))throw Error('EXISTING_REQUIRE_BINDING_REQUIRES_REVIEW');
 return prefix+source;
}
module.exports={prepareWorkerCommonJsLoader,addedLines:prefix.split('\n').length-1};
