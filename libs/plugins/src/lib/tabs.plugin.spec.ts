import { describe, it, expect } from 'vitest';
import { preprocessContentTabs } from './tabs.plugin';

describe('Content Tabs Pre-Processor', () => {
    it('should parse a single tab group with multiple tabs', () => {
        const input = [
            '=== "Python"',
            '',
            '    ```python',
            '    print("Hello")',
            '    ```',
            '',
            '=== "JavaScript"',
            '',
            '    ```javascript',
            '    console.log("Hello");',
            '    ```',
        ].join('\n');

        const result = preprocessContentTabs(input);

        expect(result).toContain('<dac-content-tabs labels="Python,JavaScript">');
        expect(result).toContain('</dac-content-tabs>');
        expect(result).toContain('<div class="content-tab-panel active" data-tab-index="0">');
        expect(result).toContain('<div class="content-tab-panel" data-tab-index="1">');
        // Test that content is de-indented
        expect(result).toContain('```python');
        expect(result).toContain('```javascript');
        expect(result).not.toContain('    ```python');
    });

    it('should assign different custom element instances to multiple groups', () => {
        const input = [
            '=== "Tab A"',
            '',
            '    Content A',
            '',
            '=== "Tab B"',
            '',
            '    Content B',
            '',
            'Some regular paragraph between groups.',
            '',
            '=== "Tab C"',
            '',
            '    Content C',
            '',
            '=== "Tab D"',
            '',
            '    Content D',
        ].join('\n');

        const result = preprocessContentTabs(input);

        expect(result).toContain('<dac-content-tabs labels="Tab A,Tab B">');
        expect(result).toContain('<dac-content-tabs labels="Tab C,Tab D">');
        expect(result).toContain('Some regular paragraph between groups.');
    });

    it('should handle non-code content tabs', () => {
        const input = [
            '=== "Ordered"',
            '',
            '    1. First',
            '    2. Second',
            '    3. Third',
            '',
            '=== "Unordered"',
            '',
            '    - Alpha',
            '    - Beta',
            '    - Gamma',
        ].join('\n');

        const result = preprocessContentTabs(input);

        expect(result).toContain('<dac-content-tabs labels="Ordered,Unordered">');
        expect(result).toContain('1. First');
        expect(result).toContain('- Alpha');
    });

    it('should pass through markdown without tabs unchanged', () => {
        const input = '# Hello\n\nSome paragraph.\n\n```js\ncode();\n```\n';
        const result = preprocessContentTabs(input);
        expect(result).toBe(input);
    });

    it('should handle a single-tab group', () => {
        const input = [
            '=== "Only Tab"',
            '',
            '    Single tab content.',
        ].join('\n');

        const result = preprocessContentTabs(input);

        expect(result).toContain('<dac-content-tabs labels="Only Tab">');
        expect(result).toContain('Single tab content.');
    });

    it('should handle tabs at end of file with no trailing newline', () => {
        const input = [
            '=== "Last"',
            '',
            '    Final content here',
        ].join('\n');

        const result = preprocessContentTabs(input);

        expect(result).toContain('<dac-content-tabs');
        expect(result).toContain('Final content here');
    });

    it('should de-indent by exactly 4 spaces', () => {
        const input = [
            '=== "Code"',
            '',
            '    ```python',
            '        indented_code()',
            '    ```',
        ].join('\n');

        const result = preprocessContentTabs(input);

        // First 4 spaces removed, inner indentation preserved
        expect(result).toContain('```python');
        expect(result).toContain('    indented_code()');
        expect(result).toContain('```');
    });
});
