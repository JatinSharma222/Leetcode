import { prisma, Difficulty } from "@repo/db";

interface TestCaseData {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  order: number;
}

interface QuestionData {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  starterTemplates: {
    python: string;
    javascript: string;
    cpp: string;
  };
  testCases: TestCaseData[];
}

const questions: QuestionData[] = [
  // ==========================================
  // EASY QUESTIONS
  // ==========================================
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: Difficulty.Easy,
    category: "Arrays & Hash Table",
    description:
      "Given an array of integers `nums` and an integer `target`, return the 0-indexed positions of the two numbers such that they add up to `target`.\n\n" +
      "**Input Format:**\n" +
      "- Line 1: Space-separated integers representing `nums`.\n" +
      "- Line 2: Single integer representing `target`.\n\n" +
      "**Output Format:**\n" +
      "- Print the two indices separated by a space in ascending order.",
    starterTemplates: {
      python: `import sys

def two_sum():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    two_sum()
`,
      javascript: `const fs = require('fs');

function twoSum() {
  const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
  if (!input[0]) return;
  const nums = input[0].trim().split(/\\s+/).map(Number);
  const target = Number(input[1]);
  
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      console.log(\`\${map.get(diff)} \${i}\`);
      return;
    }
    map.set(nums[i], i);
  }
}

twoSum();
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <sstream>

using namespace std;

int main() {
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int val;
    while (ss >> val) nums.push_back(val);
    
    int target;
    cin >> target;
    
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int diff = target - nums[i];
        if (seen.count(diff)) {
            cout << seen[diff] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`,
    },
    testCases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1", isSample: true, order: 0 },
      { input: "3 2 4\n6", expectedOutput: "1 2", isSample: true, order: 1 },
      { input: "3 3\n6", expectedOutput: "0 1", isSample: false, order: 2 },
      { input: "-1 -2 -3 -4 -5\n-8", expectedOutput: "2 4", isSample: false, order: 3 },
      { input: "10 20 30 40 50 60 70 80 90\n150", expectedOutput: "6 7", isSample: false, order: 4 },
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: Difficulty.Easy,
    category: "Stack",
    description:
      "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\n" +
      "An input string is valid if:\n" +
      "1. Open brackets must be closed by the same type of brackets.\n" +
      "2. Open brackets must be closed in the correct order.\n" +
      "3. Every close bracket has a corresponding open bracket of the same type.\n\n" +
      "**Input Format:** Single line containing the string `s`.\n" +
      "**Output Format:** Print `true` if valid, otherwise `false`.",
    starterTemplates: {
      python: `import sys

def is_valid():
    s = sys.stdin.read().strip()
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                print("false")
                return
        else:
            stack.append(ch)
            
    print("true" if not stack else "false")

if __name__ == "__main__":
    is_valid()
`,
      javascript: `const fs = require('fs');

function isValid() {
  const s = fs.readFileSync(0, 'utf-8').trim();
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const ch of s) {
    if (map[ch]) {
      if (stack.length === 0 || stack.pop() !== map[ch]) {
        console.log("false");
        return;
      }
    } else {
      stack.push(ch);
    }
  }
  console.log(stack.length === 0 ? "true" : "false");
}

isValid();
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

using namespace std;

int main() {
    string s;
    if (!(cin >> s)) {
        cout << "true" << endl;
        return 0;
    }
    stack<char> st;
    unordered_map<char, char> matching = {{')', '('}, {'}', '{'}, {']', '['}};
    
    for (char c : s) {
        if (matching.count(c)) {
            if (st.empty() || st.top() != matching[c]) {
                cout << "false" << endl;
                return 0;
            }
            st.pop();
        } else {
            st.push(c);
        }
    }
    cout << (st.empty() ? "true" : "false") << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "()", expectedOutput: "true", isSample: true, order: 0 },
      { input: "()[]{}", expectedOutput: "true", isSample: true, order: 1 },
      { input: "(]", expectedOutput: "false", isSample: true, order: 2 },
      { input: "([)]", expectedOutput: "false", isSample: false, order: 3 },
      { input: "{[]}", expectedOutput: "true", isSample: false, order: 4 },
      { input: "(((((((((())))))))))", expectedOutput: "true", isSample: false, order: 5 },
      { input: "]", expectedOutput: "false", isSample: false, order: 6 },
    ],
  },
  {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: Difficulty.Easy,
    category: "Arrays & Dynamic Programming",
    description:
      "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\n" +
      "You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\n" +
      "Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.\n\n" +
      "**Input Format:** Space-separated integers representing stock prices on consecutive days.\n" +
      "**Output Format:** Single integer representing the maximum profit.",
    starterTemplates: {
      python: `import sys

def max_profit():
    raw = sys.stdin.read().strip()
    if not raw:
        print(0)
        return
    prices = list(map(int, raw.split()))
    min_price = float('inf')
    max_p = 0
    for p in prices:
        if p < min_price:
            min_price = p
        elif p - min_price > max_p:
            max_p = p - min_price
    print(max_p)

if __name__ == "__main__":
    max_profit()
`,
      javascript: `const fs = require('fs');

function maxProfit() {
  const raw = fs.readFileSync(0, 'utf-8').trim();
  if (!raw) { console.log(0); return; }
  const prices = raw.split(/\\s+/).map(Number);
  let minPrice = Infinity;
  let maxP = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;
    else if (p - minPrice > maxP) maxP = p - minPrice;
  }
  console.log(maxP);
}

maxProfit();
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int p;
    vector<int> prices;
    while (cin >> p) prices.push_back(p);
    int min_price = 1e9, max_p = 0;
    for (int price : prices) {
        min_price = min(min_price, price);
        max_p = max(max_p, price - min_price);
    }
    cout << max_p << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "7 1 5 3 6 4", expectedOutput: "5", isSample: true, order: 0 },
      { input: "7 6 4 3 1", expectedOutput: "0", isSample: true, order: 1 },
      { input: "2 4 1", expectedOutput: "2", isSample: false, order: 2 },
      { input: "1 2", expectedOutput: "1", isSample: false, order: 3 },
      { input: "3 3 3 3 3", expectedOutput: "0", isSample: false, order: 4 },
      { input: "1 2 4 2 5 7 2 4 9 0 9", expectedOutput: "9", isSample: false, order: 5 },
    ],
  },
  {
    id: "palindrome-check",
    title: "Palindrome Check",
    difficulty: Difficulty.Easy,
    category: "Strings & Two Pointers",
    description:
      "Read a single alphanumeric string from stdin (ignoring whitespace). Print `true` if it reads the same forwards and backwards, otherwise print `false`.",
    starterTemplates: {
      python: `import sys

def check():
    s = sys.stdin.read().strip()
    print("true" if s == s[::-1] else "false")

if __name__ == "__main__":
    check()
`,
      javascript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
const rev = s.split('').reverse().join('');
console.log(s === rev ? 'true' : 'false');
`,
      cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (!(cin >> s)) { cout << "true" << endl; return 0; }
    string rev = s;
    reverse(rev.begin(), rev.end());
    cout << (s == rev ? "true" : "false") << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "racecar", expectedOutput: "true", isSample: true, order: 0 },
      { input: "hello", expectedOutput: "false", isSample: true, order: 1 },
      { input: "a", expectedOutput: "true", isSample: false, order: 2 },
      { input: "abccba", expectedOutput: "true", isSample: false, order: 3 },
      { input: "abcdecba", expectedOutput: "false", isSample: false, order: 4 },
    ],
  },

  // ==========================================
  // MEDIUM QUESTIONS
  // ==========================================
  {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: Difficulty.Medium,
    category: "Sliding Window",
    description:
      "Given a string `s`, find the length of the **longest substring** without repeating characters.\n\n" +
      "**Input Format:** Single line containing the string `s`.\n" +
      "**Output Format:** Print the integer length of the longest unique substring.",
    starterTemplates: {
      python: `import sys

def length_of_longest_substring():
    s = sys.stdin.read().rstrip('\\r\\n')
    char_index = {}
    left = 0
    max_len = 0
    
    for right, ch in enumerate(s):
        if ch in char_index and char_index[ch] >= left:
            left = char_index[ch] + 1
        char_index[ch] = right
        max_len = max(max_len, right - left + 1)
        
    print(max_len)

if __name__ == "__main__":
    length_of_longest_substring()
`,
      javascript: `const fs = require('fs');

function lengthOfLongestSubstring() {
  const s = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
  const map = new Map();
  let left = 0, maxLen = 0;
  
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (map.has(ch) && map.get(ch) >= left) {
      left = map.get(ch) + 1;
    }
    map.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  console.log(maxLen);
}

lengthOfLongestSubstring();
`,
      cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    string s;
    getline(cin, s);
    vector<int> last(256, -1);
    int left = 0, max_len = 0;
    for (int right = 0; right < (int)s.size(); ++right) {
        unsigned char c = s[right];
        if (last[c] >= left) {
            left = last[c] + 1;
        }
        last[c] = right;
        max_len = max(max_len, right - left + 1);
    }
    cout << max_len << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isSample: true, order: 0 },
      { input: "bbbbb", expectedOutput: "1", isSample: true, order: 1 },
      { input: "pwwkew", expectedOutput: "3", isSample: true, order: 2 },
      { input: "", expectedOutput: "0", isSample: false, order: 3 },
      { input: "dvdf", expectedOutput: "3", isSample: false, order: 4 },
      { input: "anviaj", expectedOutput: "5", isSample: false, order: 5 },
      { input: "abcdefghijklmnopqrstuvwxyz", expectedOutput: "26", isSample: false, order: 6 },
    ],
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: Difficulty.Medium,
    category: "Two Pointers",
    description:
      "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.\n\n" +
      "Find two lines that together with the x-axis form a container, such that the container contains the most water.\n\n" +
      "Return the maximum amount of water a container can store.\n\n" +
      "**Input Format:** Space-separated non-negative integers representing the vertical line heights.\n" +
      "**Output Format:** Single integer representing maximum water capacity.",
    starterTemplates: {
      python: `import sys

def max_area():
    raw = sys.stdin.read().strip()
    if not raw:
        print(0)
        return
    h = list(map(int, raw.split()))
    left, right = 0, len(h) - 1
    best = 0
    while left < right:
        area = min(h[left], h[right]) * (right - left)
        if area > best:
            best = area
        if h[left] < h[right]:
            left += 1
        else:
            right -= 1
    print(best)

if __name__ == "__main__":
    max_area()
`,
      javascript: `const fs = require('fs');

function maxArea() {
  const raw = fs.readFileSync(0, 'utf-8').trim();
  if (!raw) { console.log(0); return; }
  const h = raw.split(/\\s+/).map(Number);
  let left = 0, right = h.length - 1, best = 0;
  while (left < right) {
    const area = Math.min(h[left], h[right]) * (right - left);
    if (area > best) best = area;
    if (h[left] < h[right]) left++;
    else right--;
  }
  console.log(best);
}

maxArea();
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> h;
    int val;
    while (cin >> val) h.push_back(val);
    int left = 0, right = (int)h.size() - 1, best = 0;
    while (left < right) {
        int area = min(h[left], h[right]) * (right - left);
        best = max(best, area);
        if (h[left] < h[right]) left++;
        else right--;
    }
    cout << best << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "1 8 6 2 5 4 8 3 7", expectedOutput: "49", isSample: true, order: 0 },
      { input: "1 1", expectedOutput: "1", isSample: true, order: 1 },
      { input: "4 3 2 1 4", expectedOutput: "16", isSample: false, order: 2 },
      { input: "1 2 1", expectedOutput: "2", isSample: false, order: 3 },
      { input: "2 3 4 5 18 17 6", expectedOutput: "17", isSample: false, order: 4 },
    ],
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: Difficulty.Medium,
    category: "Dynamic Programming",
    description:
      "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\n" +
      "Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\n" +
      "You may assume that you have an infinite number of each kind of coin.\n\n" +
      "**Input Format:**\n" +
      "- Line 1: Space-separated integers representing coin denominations.\n" +
      "- Line 2: Single integer representing target amount.\n\n" +
      "**Output Format:** Single integer representing the minimum number of coins, or -1.",
    starterTemplates: {
      python: `import sys

def coin_change():
    lines = sys.stdin.read().splitlines()
    if not lines:
        print(-1)
        return
    coins = list(map(int, lines[0].split()))
    amount = int(lines[1])
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for c in coins:
        for x in range(c, amount + 1):
            dp[x] = min(dp[x], dp[x - c] + 1)
            
    print(dp[amount] if dp[amount] != float('inf') else -1)

if __name__ == "__main__":
    coin_change()
`,
      javascript: `const fs = require('fs');

function coinChange() {
  const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
  if (!lines[0]) return;
  const coins = lines[0].trim().split(/\\s+/).map(Number);
  const amount = Number(lines[1]);

  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const c of coins) {
    for (let x = c; x <= amount; x++) {
      dp[x] = Math.min(dp[x], dp[x - c] + 1);
    }
  }
  console.log(dp[amount] === Infinity ? -1 : dp[amount]);
}

coinChange();
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> coins;
    int c;
    while (ss >> c) coins.push_back(c);
    
    int amount;
    cin >> amount;
    
    vector<int> dp(amount + 1, 1e9);
    dp[0] = 0;
    for (int coin : coins) {
        for (int x = coin; x <= amount; ++x) {
            dp[x] = min(dp[x], dp[x - coin] + 1);
        }
    }
    cout << (dp[amount] >= 1e9 ? -1 : dp[amount]) << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "1 2 5\n11", expectedOutput: "3", isSample: true, order: 0 },
      { input: "2\n3", expectedOutput: "-1", isSample: true, order: 1 },
      { input: "1\n0", expectedOutput: "0", isSample: true, order: 2 },
      { input: "186 419 83 408\n6249", expectedOutput: "20", isSample: false, order: 3 },
      { input: "2 5 10 1\n27", expectedOutput: "4", isSample: false, order: 4 },
    ],
  },
  {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: Difficulty.Medium,
    category: "Arrays & Prefix Sum",
    description:
      "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\n" +
      "The product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\n" +
      "You must write an algorithm that runs in **O(n)** time and without using the division operation.\n\n" +
      "**Input Format:** Space-separated integers representing `nums`.\n" +
      "**Output Format:** Space-separated integers representing the output array.",
    starterTemplates: {
      python: `import sys

def product_except_self():
    raw = sys.stdin.read().strip()
    if not raw:
        return
    nums = list(map(int, raw.split()))
    n = len(nums)
    res = [1] * n
    
    prefix = 1
    for i in range(n):
        res[i] = prefix
        prefix *= nums[i]
        
    suffix = 1
    for i in range(n - 1, -1, -1):
        res[i] *= suffix
        suffix *= nums[i]
        
    print(" ".join(map(str, res)))

if __name__ == "__main__":
    product_except_self()
`,
      javascript: `const fs = require('fs');

function productExceptSelf() {
  const raw = fs.readFileSync(0, 'utf-8').trim();
  if (!raw) return;
  const nums = raw.split(/\\s+/).map(Number);
  const n = nums.length;
  const res = new Array(n).fill(1);

  let prefix = 1;
  for (let i = 0; i < n; i++) {
    res[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= suffix;
    suffix *= nums[i];
  }
  console.log(res.join(' '));
}

productExceptSelf();
`,
      cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> nums;
    int val;
    while (cin >> val) nums.push_back(val);
    int n = nums.size();
    vector<int> res(n, 1);
    
    int prefix = 1;
    for (int i = 0; i < n; ++i) {
        res[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; --i) {
        res[i] *= suffix;
        suffix *= nums[i];
    }
    for (int i = 0; i < n; ++i) {
        cout << res[i] << (i + 1 == n ? "" : " ");
    }
    cout << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "1 2 3 4", expectedOutput: "24 12 8 6", isSample: true, order: 0 },
      { input: "-1 1 0 -3 3", expectedOutput: "0 0 9 0 0", isSample: true, order: 1 },
      { input: "2 3", expectedOutput: "3 2", isSample: false, order: 2 },
      { input: "0 0", expectedOutput: "0 0", isSample: false, order: 3 },
      { input: "5 2 6 1", expectedOutput: "12 30 10 60", isSample: false, order: 4 },
    ],
  },

  // ==========================================
  // HARD QUESTIONS
  // ==========================================
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: Difficulty.Hard,
    category: "Two Pointers & Monotonic Stack",
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\n" +
      "**Input Format:** Space-separated non-negative integers representing heights.\n" +
      "**Output Format:** Single integer representing total trapped water volume.",
    starterTemplates: {
      python: `import sys

def trap():
    raw = sys.stdin.read().strip()
    if not raw:
        print(0)
        return
    h = list(map(int, raw.split()))
    left, right = 0, len(h) - 1
    left_max = right_max = 0
    ans = 0
    
    while left < right:
        if h[left] < h[right]:
            if h[left] >= left_max:
                left_max = h[left]
            else:
                ans += left_max - h[left]
            left += 1
        else:
            if h[right] >= right_max:
                right_max = h[right]
            else:
                ans += right_max - h[right]
            right -= 1
            
    print(ans)

if __name__ == "__main__":
    trap()
`,
      javascript: `const fs = require('fs');

function trap() {
  const raw = fs.readFileSync(0, 'utf-8').trim();
  if (!raw) { console.log(0); return; }
  const h = raw.split(/\\s+/).map(Number);
  let left = 0, right = h.length - 1;
  let leftMax = 0, rightMax = 0, ans = 0;

  while (left < right) {
    if (h[left] < h[right]) {
      if (h[left] >= leftMax) leftMax = h[left];
      else ans += leftMax - h[left];
      left++;
    } else {
      if (h[right] >= rightMax) rightMax = h[right];
      else ans += rightMax - h[right];
      right--;
    }
  }
  console.log(ans);
}

trap();
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> h;
    int val;
    while (cin >> val) h.push_back(val);
    int left = 0, right = (int)h.size() - 1;
    int left_max = 0, right_max = 0;
    long long ans = 0;
    
    while (left < right) {
        if (h[left] < h[right]) {
            if (h[left] >= left_max) left_max = h[left];
            else ans += left_max - h[left];
            left++;
        } else {
            if (h[right] >= right_max) right_max = h[right];
            else ans += right_max - h[right];
            right--;
        }
    }
    cout << ans << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isSample: true, order: 0 },
      { input: "4 2 0 3 2 5", expectedOutput: "9", isSample: true, order: 1 },
      { input: "3 0 2 0 4", expectedOutput: "7", isSample: false, order: 2 },
      { input: "1 2 3 4 5", expectedOutput: "0", isSample: false, order: 3 },
      { input: "5 4 3 2 1", expectedOutput: "0", isSample: false, order: 4 },
      { input: "5 0 5", expectedOutput: "5", isSample: false, order: 5 },
      { input: "0 0 0 0", expectedOutput: "0", isSample: false, order: 6 },
    ],
  },
  {
    id: "longest-valid-parentheses",
    title: "Longest Valid Parentheses",
    difficulty: Difficulty.Hard,
    category: "Stack & Dynamic Programming",
    description:
      "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.\n\n" +
      "**Input Format:** Single string `s` of parentheses characters.\n" +
      "**Output Format:** Single integer representing the length of the longest valid substring.",
    starterTemplates: {
      python: `import sys

def longest_valid_parentheses():
    s = sys.stdin.read().strip()
    stack = [-1]
    max_len = 0
    
    for i, ch in enumerate(s):
        if ch == '(':
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                max_len = max(max_len, i - stack[-1])
                
    print(max_len)

if __name__ == "__main__":
    longest_valid_parentheses()
`,
      javascript: `const fs = require('fs');

function longestValidParentheses() {
  const s = fs.readFileSync(0, 'utf-8').trim();
  const stack = [-1];
  let maxLen = 0;

  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) {
        stack.push(i);
      } else {
        maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
      }
    }
  }
  console.log(maxLen);
}

longestValidParentheses();
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (!(cin >> s)) {
        cout << 0 << endl;
        return 0;
    }
    stack<int> st;
    st.push(-1);
    int max_len = 0;
    for (int i = 0; i < (int)s.size(); ++i) {
        if (s[i] == '(') {
            st.push(i);
        } else {
            st.pop();
            if (st.empty()) {
                st.push(i);
            } else {
                max_len = max(max_len, i - st.top());
            }
        }
    }
    cout << max_len << endl;
    return 0;
}
`,
    },
    testCases: [
      { input: "(()", expectedOutput: "2", isSample: true, order: 0 },
      { input: ")()())", expectedOutput: "4", isSample: true, order: 1 },
      { input: "", expectedOutput: "0", isSample: true, order: 2 },
      { input: "()(()", expectedOutput: "2", isSample: false, order: 3 },
      { input: "()(())", expectedOutput: "6", isSample: false, order: 4 },
      { input: "((()))())", expectedOutput: "8", isSample: false, order: 5 },
      { input: "))))((((", expectedOutput: "0", isSample: false, order: 6 },
    ],
  },
];

async function main() {
  console.log(`Starting database seed with ${questions.length} high-quality questions...`);

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        category: q.category,
        starterTemplates: q.starterTemplates,
      },
      create: {
        id: q.id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        category: q.category,
        starterTemplates: q.starterTemplates,
      },
    });

    await prisma.testCase.deleteMany({ where: { questionId: q.id } });
    await prisma.testCase.createMany({
      data: q.testCases.map((tc) => ({
        ...tc,
        questionId: q.id,
      })),
    });

    console.log(
      `✓ Seeded [${q.difficulty}] "${q.title}" (${q.category}) with ${q.testCases.length} test cases`
    );
  }
}

main()
  .then(async () => {
    console.log("\nDatabase seeding completed successfully!");
  })
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  });
