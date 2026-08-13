export const CODE_TEMPLATES: Record<string, string> = {
  python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if len(input_data) >= 2:
        a = int(input_data[0])
        b = int(input_data[1])
        print(a + b)

if __name__ == "__main__":
    solve()
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Read input from STDIN and print result to STDOUT
    int a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (input.length >= 2) {
        const a = parseInt(input[0], 10);
        const b = parseInt(input[1], 10);
        console.log(a + b);
    }
}

solve();
`,
};

/**
 * Safe accessor for CODE_TEMPLATES. Plain `CODE_TEMPLATES[lang]` types as
 * `string | undefined` under `noUncheckedIndexedAccess` (since the value
 * type is a Record index signature) — this centralizes the fallback so call
 * sites always get a plain `string`.
 */
export function getCodeTemplate(language: string): string {
  return CODE_TEMPLATES[language] ?? `// Write your ${language} solution here...`;
}