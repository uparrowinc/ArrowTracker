/**
 * HTML Encoding Security Layer
 * 
 * This provides an additional security layer beyond ZOD validation and DOMPurify sanitization.
 * Even if malicious content somehow gets through, HTML encoding renders it harmless.
 */

export class HTMLEncoder {
  
  /**
   * Encode HTML entities to prevent XSS attacks
   * This is equivalent to ColdFusion's encodeForHTML function
   */
  static encodeForHTML(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
      .replace(/&/g, '&amp;')    // Must be first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')   // More secure than &apos;
      .replace(/\//g, '&#x2F;'); // Forward slash for extra security
  }

  /**
   * Encode for HTML attributes
   */
  static encodeForHTMLAttribute(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\n/g, '&#10;')
      .replace(/\r/g, '&#13;')
      .replace(/\t/g, '&#9;');
  }

  /**
   * Encode for JavaScript strings (when data is embedded in JS)
   */
  static encodeForJavaScript(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\b/g, '\\b')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0')
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E')
      .replace(/&/g, '\\u0026');
  }

  /**
   * Encode for CSS values
   */
  static encodeForCSS(input: string | null | undefined): string {
    if (!input) return '';
    
    // Remove any characters that could break CSS
    return input.replace(/[^a-zA-Z0-9\-_]/g, '');
  }

  /**
   * Encode for URL parameters
   */
  static encodeForURL(input: string | null | undefined): string {
    if (!input) return '';
    
    return encodeURIComponent(input);
  }

  /**
   * Multi-layer security encode - combines multiple encoding methods
   */
  static secureEncode(input: string | null | undefined, context: 'html' | 'attribute' | 'js' | 'css' | 'url' = 'html'): string {
    if (!input) return '';
    
    // Context-specific encoding
    switch (context) {
      case 'attribute':
        return this.encodeForHTMLAttribute(input);
      case 'js':
        return this.encodeForJavaScript(input);
      case 'css':
        return this.encodeForCSS(input);
      case 'url':
        return this.encodeForURL(input);
      default:
        return this.encodeForHTML(input);
    }
  }

  /**
   * Validate and encode blog content with triple-layer security
   */
  static secureBlogContent(content: string | null | undefined): string {
    if (!content) return '';
    
    // Layer 1: HTML encode everything first
    let secure = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Layer 2: Additional protection for common attack patterns
    secure = secure
      .replace(/javascript:/gi, 'blocked-javascript:')
      .replace(/vbscript:/gi, 'blocked-vbscript:')
      .replace(/data:/gi, 'blocked-data:')
      .replace(/on\w+\s*=/gi, 'blocked-event=');
    
    // Layer 3: Remove any remaining script-like patterns
    secure = secure
      .replace(/<script[^>]*>.*?<\/script>/gis, '[Blocked Script]')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '[Blocked iFrame]')
      .replace(/<object[^>]*>.*?<\/object>/gis, '[Blocked Object]')
      .replace(/<embed[^>]*>/gis, '[Blocked Embed]');
    
    return secure;
  }

  /**
   * Safe display function for user input
   */
  static safeDisplay(input: string | null | undefined, maxLength: number = 1000): string {
    if (!input) return '';
    
    // Truncate to prevent DoS
    let safe = input.length > maxLength ? input.substring(0, maxLength) + '...' : input;
    
    // Encode for safe HTML display
    return safe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

// Export convenience functions
export const encodeForHTML = HTMLEncoder.encodeForHTML;
export const encodeForHTMLAttribute = HTMLEncoder.encodeForHTMLAttribute;
export const encodeForJavaScript = HTMLEncoder.encodeForJavaScript;
export const secureEncode = HTMLEncoder.secureEncode;
export const secureBlogContent = HTMLEncoder.secureBlogContent;
export const safeDisplay = HTMLEncoder.safeDisplay;

// Export for HTML encoder functions
export const htmlEncode = HTMLEncoder.encodeForHTML;
export const safeUserDisplay = HTMLEncoder.safeDisplay;