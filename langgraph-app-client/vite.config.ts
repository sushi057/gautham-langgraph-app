import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { OutputAsset, OutputChunk } from 'rollup';

// Custom plugin to inline CSS into shadow DOM instead of document.head
const cssInlinerPlugin = (): Plugin => {
  return {
    name: 'css-inliner-plugin',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      // Find CSS asset
      const cssAssets = Object.keys(bundle).filter(fileName => 
        fileName.includes('koncierge-browser') && fileName.endsWith('.css')
      );
      
      if (cssAssets.length === 0) return;
      
      // Find main JS chunk
      const jsChunkId = Object.keys(bundle).find(
        id => bundle[id].type === 'chunk' && id === 'koncierge-browser.js'
      );
      
      if (!jsChunkId) return;
      
      const jsChunk = bundle[jsChunkId] as OutputChunk;
      const cssAsset = bundle[cssAssets[0]] as OutputAsset;
      
      if (jsChunk.type !== 'chunk' || !cssAsset || cssAsset.type !== 'asset') return;
      
      // Get CSS content
      const cssContent = typeof cssAsset.source === 'string' 
        ? cssAsset.source 
        : Buffer.from(cssAsset.source).toString('utf8');
      
      let modifiedCode = jsChunk.code;
      
      // Instead of using regex to modify connectedCallback, let's inject a script at the beginning
      // that will patch the HTMLElement prototype to include style injection in the shadow root
      
      const patchCode = `
// Remove any existing style injection in head
(function() {
  // Find and remove any style element that might have been added previously
  const existingStyles = document.querySelectorAll('style[data-koncierge]');
  existingStyles.forEach(style => style.remove());
})();

// Patch HTMLElement connectedCallback to inject styles into shadow DOM
(function() {
  // Store original customElements.define method
  const originalDefine = customElements.define;
  
  // Override the define method to inject our style injector
  customElements.define = function(name, constructor, options) {
    // Only patch KonciergeWidget
    if (name === 'koncierge-widget') {
      const originalConnectedCallback = constructor.prototype.connectedCallback || function() {};
      
      // Override connectedCallback
      constructor.prototype.connectedCallback = function() {
        // Call original connectedCallback first
        originalConnectedCallback.apply(this, arguments);
        
        // Get the shadow root
        const shadowRoot = this.shadowRoot;
        
        // If shadow root exists, inject styles
        if (shadowRoot) {
          // Create style element
          const styleElement = document.createElement('style');
          styleElement.textContent = ${JSON.stringify(cssContent)};
          styleElement.setAttribute('data-koncierge', 'true');
          
          // Append to shadow root
          shadowRoot.appendChild(styleElement);
        }
      };
    }
    
    // Call original define method
    return originalDefine.call(this, name, constructor, options);
  };
})();
`;
      
      // Add patch code at the beginning of the JS file
      modifiedCode = patchCode + modifiedCode;
      
      // Update the chunk with modified code
      jsChunk.code = modifiedCode;
      
      // Remove CSS asset as it's now inlined
      cssAssets.forEach(asset => {
        delete bundle[asset];
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    cssInlinerPlugin()
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/wc-main.tsx'),
      name: 'KonciergeWidget',
      fileName: 'koncierge-browser',
      formats: ['iife'], // IIFE = browser-ready
    },
    rollupOptions: {
      output: {
        entryFileNames: 'koncierge-browser.js',
        manualChunks: undefined,
      },
      external: [], // Don't treat any packages as external to ensure standalone build
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Set extremely high to inline everything
    minify: true,
    sourcemap: false,
  },
  css: {
    modules: {
      scopeBehaviour: 'global'
    },
    devSourcemap: false,
  }
});
