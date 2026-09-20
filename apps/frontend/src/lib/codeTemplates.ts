export interface ProblemTemplate {
  python: string;
  cpp: string;
  javascript: string;
}

export const PROBLEM_TEMPLATES: Record<string, ProblemTemplate> = {
  "sum-two-numbers": {
    python: `import sys

def sum_two_numbers(a: int, b: int) -> int:
    return a + b

def main():
    input_data = sys.stdin.read().split()
    if len(input_data) >= 2:
        a = int(input_data[0])
        b = int(input_data[1])
        print(sum_two_numbers(a, b))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
using namespace std;

int sumTwoNumbers(int a, int b) {
    return a + b;
}

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << sumTwoNumbers(a, b) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function sumTwoNumbers(a, b) {
    return a + b;
}

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (input.length >= 2) {
        const a = parseInt(input[0], 10);
        const b = parseInt(input[1], 10);
        console.log(sumTwoNumbers(a, b));
    }
}

main();
`,
  },

  "reverse-string": {
    python: `import sys

def reverse_string(s: str) -> str:
    return s[::-1]

def main():
    s = sys.stdin.read().rstrip("\\r\\n")
    print(reverse_string(s))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

string reverseString(string s) {
    reverse(s.begin(), s.end());
    return s;
}

int main() {
    string s;
    if (getline(cin, s)) {
        // Strip trailing \\r if present
        if (!s.empty() && s.back() == '\\r') s.pop_back();
        cout << reverseString(s) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function reverseString(s) {
    return s.split('').reverse().join('');
}

function main() {
    const s = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');
    console.log(reverseString(s));
}

main();
`,
  },

  "fizzbuzz": {
    python: `import sys

def fizz_buzz(n: int):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        fizz_buzz(n)

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
using namespace std;

void fizzBuzz(int n) {
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) cout << "FizzBuzz\\n";
        else if (i % 3 == 0) cout << "Fizz\\n";
        else if (i % 5 == 0) cout << "Buzz\\n";
        else cout << i << "\\n";
    }
}

int main() {
    int n;
    if (cin >> n) {
        fizzBuzz(n);
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function fizzBuzz(n) {
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) console.log("FizzBuzz");
        else if (i % 3 === 0) console.log("Fizz");
        else if (i % 5 === 0) console.log("Buzz");
        else console.log(i);
    }
}

function main() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (raw) {
        fizzBuzz(parseInt(raw, 10));
    }
}

main();
`,
  },

  "palindrome-check": {
    python: `import sys

def is_palindrome(s: str) -> bool:
    return s == s[::-1]

def main():
    s = sys.stdin.read().rstrip("\\r\\n")
    print("true" if is_palindrome(s) else "false")

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
using namespace std;

bool isPalindrome(const string& s) {
    int l = 0, r = (int)s.length() - 1;
    while (l < r) {
        if (s[l] != s[r]) return false;
        l++;
        r--;
    }
    return true;
}

int main() {
    string s;
    if (getline(cin, s)) {
        if (!s.empty() && s.back() == '\\r') s.pop_back();
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function isPalindrome(s) {
    return s === s.split('').reverse().join('');
}

function main() {
    const s = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');
    console.log(isPalindrome(s) ? "true" : "false");
}

main();
`,
  },

  "factorial": {
    python: `import sys

def factorial(n: int) -> int:
    res = 1
    for i in range(2, n + 1):
        res *= i
    return res

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        print(factorial(n))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
using namespace std;

long long factorial(int n) {
    long long res = 1;
    for (int i = 2; i <= n; i++) {
        res *= i;
    }
    return res;
}

int main() {
    int n;
    if (cin >> n) {
        cout << factorial(n) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function factorial(n) {
    let res = 1n;
    for (let i = 2n; i <= BigInt(n); i++) {
        res *= i;
    }
    return res.toString();
}

function main() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (raw) {
        console.log(factorial(parseInt(raw, 10)));
    }
}

main();
`,
  },

  "max-in-array": {
    python: `import sys

def max_in_array(nums: list[int]) -> int:
    return max(nums)

def main():
    nums = list(map(int, sys.stdin.read().split()))
    if nums:
        print(max_in_array(nums))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int val;
    vector<int> nums;
    while (cin >> val) {
        nums.push_back(val);
    }
    if (!nums.empty()) {
        cout << *max_element(nums.begin(), nums.end()) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function main() {
    const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
    if (nums.length > 0 && !isNaN(nums[0])) {
        console.log(Math.max(...nums));
    }
}

main();
`,
  },

  "gcd-two-numbers": {
    python: `import sys
import math

def gcd(a: int, b: int) -> int:
    return math.gcd(a, b)

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        print(gcd(a, b))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <numeric>
using namespace std;

int gcd(int a, int b) {
    return std::gcd(a, b);
}

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << gcd(a, b) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function main() {
    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (tokens.length >= 2) {
        const a = parseInt(tokens[0], 10);
        const b = parseInt(tokens[1], 10);
        console.log(gcd(a, b));
    }
}

main();
`,
  },

  "count-vowels": {
    python: `import sys

def count_vowels(s: str) -> int:
    vowels = set("aeiouAEIOU")
    return sum(1 for ch in s if ch in vowels)

def main():
    s = sys.stdin.read()
    print(count_vowels(s))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
using namespace std;

int countVowels(const string& s) {
    int count = 0;
    string vowels = "aeiouAEIOU";
    for (char c : s) {
        if (vowels.find(c) != string::npos) count++;
    }
    return count;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << countVowels(s) << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function countVowels(s) {
    const matches = s.match(/[aeiouAEIOU]/g);
    return matches ? matches.length : 0;
}

function main() {
    const s = fs.readFileSync(0, 'utf-8');
    console.log(countVowels(s));
}

main();
`,
  },

  "two-sum": {
    python: `import sys

def two_sum(nums: list[int], target: int) -> str:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            first = min(seen[diff], i)
            second = max(seen[diff], i)
            return f"{first} {second}"
        seen[num] = i
    return ""

def main():
    lines = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
    if len(lines) >= 2:
        nums = list(map(int, lines[0].split()))
        target = int(lines[1])
        print(two_sum(nums, target))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <unordered_map>
using namespace std;

int main() {
    string line1;
    int target;
    if (getline(cin, line1) && cin >> target) {
        stringstream ss(line1);
        vector<int> nums;
        int x;
        while (ss >> x) nums.push_back(x);

        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                cout << seen[complement] << " " << i << endl;
                break;
            }
            seen[nums[i]] = i;
        }
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) {
            return \`\${map.get(comp)} \${i}\`;
        }
        map.set(nums[i], i);
    }
    return "";
}

function main() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/).filter(Boolean);
    if (lines.length >= 2) {
        const nums = lines[0].trim().split(/\\s+/).map(Number);
        const target = parseInt(lines[1].trim(), 10);
        console.log(twoSum(nums, target));
    }
}

main();
`,
  },

  "binary-to-decimal": {
    python: `import sys

def binary_to_decimal(binary_str: str) -> int:
    return int(binary_str, 2)

def main():
    binary_str = sys.stdin.read().strip()
    if binary_str:
        print(binary_to_decimal(binary_str))

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        long long val = 0;
        for (char c : s) {
            if (c == '0' || c == '1') {
                val = (val << 1) + (c - '0');
            }
        }
        cout << val << endl;
    }
    return 0;
}
`,
    javascript: `const fs = require('fs');

function main() {
    const binary = fs.readFileSync(0, 'utf-8').trim();
    if (binary) {
        console.log(parseInt(binary, 2));
    }
}

main();
`,
  },
};

export const DEFAULT_TEMPLATES: Record<string, string> = {
  python: `import sys

def solve():
    # Read input from STDIN and print result to STDOUT
    input_data = sys.stdin.read().split()
    # Your logic here...

if __name__ == "__main__":
    solve()
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Read input from STDIN and print result to STDOUT
    
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    // Read input from STDIN (fd 0) and print result to STDOUT
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    // Your logic here...
}

solve();
`,
};

export function getCodeTemplate(language: string, questionId?: string): string {
  if (questionId && PROBLEM_TEMPLATES[questionId]) {
    const problemTpls = PROBLEM_TEMPLATES[questionId];
    if (language in problemTpls) {
      return problemTpls[language as keyof ProblemTemplate];
    }
  }

  return DEFAULT_TEMPLATES[language] ?? `// Write your ${language} solution here...`;
}