export interface ProblemEditorial {
  hints: string[];
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
}

export const PROBLEM_METADATA: Record<string, ProblemEditorial> = {
  "two-sum": {
    hints: [
      "Consider using a hash map to remember values you have encountered and their corresponding indices.",
      "For each number x in the array, check if target - x is already stored in your hash map.",
      "If target - x is found, you have found the pair! Otherwise, insert x and its index into the map.",
    ],
    approach: "One-Pass Hash Map",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    explanation:
      "While iterating through the array once, compute the complement (target - num). Check in O(1) average time if the complement exists in the hash map. If it does, return the complement index and the current index. If not, record the current value and index.",
  },
  "reverse-string": {
    hints: [
      "You can solve this using two pointers placed at opposite ends of the sequence.",
      "Swap the elements at the left and right pointers, then increment left and decrement right.",
      "Continue the process until the left pointer meets or crosses the right pointer.",
    ],
    approach: "Two-Pointer In-Place Swap",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Place one pointer at index 0 and another at index N-1. In a loop, swap the characters at both pointers and move the pointers towards the center. The operation completes in N/2 iterations with no extra memory allocation.",
  },
  "sum-two-numbers": {
    hints: [
      "Read the two integer values from standard input.",
      "Compute their sum and print the result directly to standard output.",
    ],
    approach: "Direct Arithmetic Sum",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    explanation:
      "Read the two integers from standard input stream. Calculate their mathematical sum and print the single integer result.",
  },
  "palindrome-check": {
    hints: [
      "A palindrome reads the same backwards and forwards.",
      "Compare characters from the outer boundaries moving towards the center.",
      "If all opposite characters match until the pointers meet, the string is a palindrome.",
    ],
    approach: "Two-Pointer Verification",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Initialize pointers at the start and end of the string. Compare characters at both positions. If any mismatch occurs, immediately return false. If pointers cross without mismatch, return true.",
  },
  "factorial": {
    hints: [
      "Remember that 0! = 1 and 1! = 1.",
      "For n > 1, factorial is the product of all integers from 1 up to n.",
      "Use an iterative loop with a running product or recursion with base case n <= 1.",
    ],
    approach: "Iterative Multiplication",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Initialize accumulator to 1. Loop from 2 to N, multiplying the accumulator by each integer. Return the accumulated product.",
  },
  "max-in-array": {
    hints: [
      "Initialize your maximum tracker to the first element in the array.",
      "Iterate through the remaining elements one by one.",
      "Whenever you encounter an element larger than your current maximum, update it.",
    ],
    approach: "Linear Single-Pass Scan",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Traverse the array once from beginning to end. Keep track of the highest value seen so far. After examining all elements, the tracker holds the global maximum.",
  },
  "gcd-two-numbers": {
    hints: [
      "The Euclidean algorithm states that gcd(a, b) = gcd(b, a % b).",
      "Repeat the division remainder step until b becomes 0.",
      "When b reaches 0, the remaining value of a is the greatest common divisor.",
    ],
    approach: "Euclidean Algorithm",
    timeComplexity: "O(log(min(a, b)))",
    spaceComplexity: "O(1)",
    explanation:
      "Repeatedly replace (a, b) with (b, a % b) until b equals 0. The time complexity is logarithmic with respect to the input size because the remainder decreases by at least half every two steps.",
  },
  "count-vowels": {
    hints: [
      "Define a set of vowels: 'a', 'e', 'i', 'o', 'u' (and their uppercase equivalents).",
      "Initialize a counter to 0.",
      "Iterate over each character in the string, incrementing the counter if the character is in your vowel set.",
    ],
    approach: "Linear Scan with Hash Set Lookup",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Store the five vowel characters in a lookup set. Iterate through the string of length N, checking each character in O(1) time against the set, incrementing the count whenever a match is found.",
  },
  "fizzbuzz": {
    hints: [
      "Check the condition for multiples of 15 (divisible by both 3 and 5) before checking 3 or 5 individually.",
      "If divisible by 3, output 'Fizz'. If divisible by 5, output 'Buzz'.",
      "Otherwise, output the number itself.",
    ],
    approach: "Modulo Condition Simulation",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Iterate from 1 to N. Evaluate whether the number is divisible by 15 first to handle the combined case, followed by 3 and 5. Otherwise print the numeric string representation.",
  },
  "binary-to-decimal": {
    hints: [
      "Each binary digit from right to left represents an increasing power of 2 (2^0, 2^1, 2^2, ...).",
      "Alternatively, accumulate left-to-right using: result = result * 2 + digit.",
      "Be careful to parse characters as digits '0' or '1'.",
    ],
    approach: "Horner's Base-2 Accumulation",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    explanation:
      "Iterate through the binary string characters from left to right. Multiply the running total by 2 and add the numeric value of the current bit (0 or 1). This computes the decimal value in a single pass without computing explicit powers.",
  },
};

export const DEFAULT_PROBLEM_METADATA: ProblemEditorial = {
  hints: [
    "Carefully analyze problem constraints and identify edge cases (empty input, negatives, boundaries).",
    "Start by sketching a brute-force approach, identify its bottleneck, and look for repeated work.",
    "Consider common algorithmic patterns such as hash maps, two pointers, or prefix sums to optimize.",
  ],
  approach: "Standard Algorithmic Pattern",
  timeComplexity: "O(N)",
  spaceComplexity: "O(1)",
  explanation:
    "Analyze input constraints to determine whether a linear or sub-linear approach is required. Implement with proper boundary and edge case handling.",
};

export function getProblemMetadata(questionId?: string): ProblemEditorial {
  if (!questionId) return DEFAULT_PROBLEM_METADATA;
  return PROBLEM_METADATA[questionId] || DEFAULT_PROBLEM_METADATA;
}
