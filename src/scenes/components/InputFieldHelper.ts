/**
 * InputFieldHelper - Creates styled HTML input fields
 */
export class InputFieldHelper {
  static create(
    x: number,
    y: number,
    width: number,
    height: number,
    placeholder: string
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.autocomplete = 'on';
    input.style.position = 'absolute';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.width = `${width}px`;
    input.style.height = `${height}px`;
    input.style.fontSize = '18px';
    input.style.padding = '10px 15px';
    input.style.border = '2px solid #3498db';
    input.style.borderRadius = '8px';
    input.style.backgroundColor = '#34495e';
    input.style.color = '#ecf0f1';
    input.style.boxSizing = 'border-box';
    input.style.textAlign = 'center';
    input.style.fontFamily = 'Arial, sans-serif';
    input.style.outline = 'none';
    input.style.transition = 'all 0.3s';
    
    // Focus effect
    input.addEventListener('focus', () => {
      input.style.border = '2px solid #3498db';
      input.style.backgroundColor = '#2c3e50';
    });
    
    input.addEventListener('blur', () => {
      input.style.border = '2px solid #3498db';
      input.style.backgroundColor = '#34495e';
    });
    
    document.body.appendChild(input);
    return input;
  }

  static removeAll(inputs: (HTMLInputElement | null)[]): void {
    inputs.forEach(input => {
      if (input && input.parentNode) {
        input.parentNode.removeChild(input);
      }
    });
  }
}
