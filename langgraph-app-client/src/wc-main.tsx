import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

class KonciergeWidget extends HTMLElement {
  private mountPoint: HTMLDivElement | null = null;
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    try {
      // Create a container for React to render into
      this.mountPoint = document.createElement('div');
      
      // Create shadow DOM and attach styles
      const shadow = this.attachShadow({ mode: 'open' });
      
      // Add a container style to ensure the widget displays properly
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          font-family: sans-serif;
        }
        
        .koncierge-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
      `;
      
      shadow.appendChild(style);
      shadow.appendChild(this.mountPoint);
      
      // Add a class to the mount point for styling
      this.mountPoint.className = 'koncierge-container';

      // Render React component into the shadow DOM
      this.root = ReactDOM.createRoot(this.mountPoint);
      this.root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      
      console.log('Koncierge widget initialized successfully');
    } catch (error) {
      console.error('Error initializing Koncierge widget:', error);
    }
  }
  
  // Clean up when the element is removed from the DOM
  disconnectedCallback() {
    try {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      this.mountPoint = null;
    } catch (error) {
      console.error('Error unmounting Koncierge widget:', error);
    }
  }
}

// Define the custom element
if (!customElements.get('koncierge-widget')) {
  customElements.define('koncierge-widget', KonciergeWidget);
  console.log('Koncierge widget custom element registered');
} else {
  console.warn('Koncierge widget custom element already registered');
}

// Export components for direct usage
export { App };