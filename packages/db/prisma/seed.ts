import { prisma } from "@repo/db";

const questions = [
  {
    id: "sum-two-numbers",
    title: "Sum of Two Numbers",
    description:
      "Read two space-separated integers from stdin and print their sum.",
    testCases: [
      { input: "3 5", expectedOutput: "8", isSample: true, order: 0 },
      { input: "10 20", expectedOutput: "30", isSample: true, order: 1 },
      { input: "-4 7", expectedOutput: "3", isSample: false, order: 2 },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse a String",
    description: "Read a single line from stdin and print it reversed.",
    testCases: [
      { input: "hello", expectedOutput: "olleh", isSample: true, order: 0 },
      { input: "leetcode", expectedOutput: "edoceetel", isSample: true, order: 1 },
      { input: "a", expectedOutput: "a", isSample: false, order: 2 },
    ],
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    description:
      "Read an integer N from stdin. For numbers 1 to N, print 'Fizz' if divisible by 3, 'Buzz' if divisible by 5, 'FizzBuzz' if divisible by both, otherwise the number itself — one per line.",
    testCases: [
      {
        input: "5",
        expectedOutput: "1\n2\nFizz\n4\nBuzz",
        isSample: true,
        order: 0,
      },
      {
        input: "15",
        expectedOutput:
          "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
        isSample: false,
        order: 1,
      },
    ],
  },
  {
    id: "palindrome-check",
    title: "Palindrome Check",
    description:
      "Read a single line from stdin. Print 'true' if it reads the same forwards and backwards, otherwise print 'false'.",
    testCases: [
      { input: "racecar", expectedOutput: "true", isSample: true, order: 0 },
      { input: "hello", expectedOutput: "false", isSample: true, order: 1 },
      { input: "a", expectedOutput: "true", isSample: false, order: 2 },
    ],
  },
  {
    id: "factorial",
    title: "Factorial",
    description:
      "Read a non-negative integer N from stdin and print N! (N factorial). By convention, 0! = 1.",
    testCases: [
      { input: "5", expectedOutput: "120", isSample: true, order: 0 },
      { input: "0", expectedOutput: "1", isSample: true, order: 1 },
      { input: "7", expectedOutput: "5040", isSample: false, order: 2 },
    ],
  },
  {
    id: "max-in-array",
    title: "Maximum in Array",
    description:
      "Read a line of space-separated integers from stdin and print the largest value.",
    testCases: [
      { input: "3 7 2 9 4", expectedOutput: "9", isSample: true, order: 0 },
      { input: "-5 -1 -10", expectedOutput: "-1", isSample: true, order: 1 },
      { input: "100", expectedOutput: "100", isSample: false, order: 2 },
    ],
  },
  {
    id: "gcd-two-numbers",
    title: "GCD of Two Numbers",
    description:
      "Read two space-separated non-negative integers from stdin and print their greatest common divisor.",
    testCases: [
      { input: "12 18", expectedOutput: "6", isSample: true, order: 0 },
      { input: "17 5", expectedOutput: "1", isSample: true, order: 1 },
      { input: "0 5", expectedOutput: "5", isSample: false, order: 2 },
    ],
  },
  {
    id: "count-vowels",
    title: "Count Vowels",
    description:
      "Read a single line from stdin and print the number of vowels (a, e, i, o, u — case-insensitive) it contains.",
    testCases: [
      { input: "hello world", expectedOutput: "3", isSample: true, order: 0 },
      { input: "xyz", expectedOutput: "0", isSample: true, order: 1 },
      { input: "AEIOU aeiou", expectedOutput: "10", isSample: false, order: 2 },
    ],
  },
  {
    id: "two-sum",
    title: "Two Sum",
    description:
      "The first line contains space-separated integers (the array). The second line contains a single integer (the target). " +
      "Print the two 0-indexed positions whose values add up to the target, space-separated, in ascending order. " +
      "Assume exactly one valid pair exists.",
    testCases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1", isSample: true, order: 0 },
      { input: "3 2 4\n6", expectedOutput: "1 2", isSample: true, order: 1 },
      { input: "3 3\n6", expectedOutput: "0 1", isSample: false, order: 2 },
    ],
  },
  {
    id: "binary-to-decimal",
    title: "Binary to Decimal",
    description:
      "Read a string of '0's and '1's from stdin representing a binary number, and print its decimal value.",
    testCases: [
      { input: "1010", expectedOutput: "10", isSample: true, order: 0 },
      { input: "1111", expectedOutput: "15", isSample: true, order: 1 },
      { input: "0", expectedOutput: "0", isSample: false, order: 2 },
    ],
  },
];

async function main() {
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: { title: q.title, description: q.description },
      create: { id: q.id, title: q.title, description: q.description },
    });

    await prisma.testCase.deleteMany({ where: { questionId: q.id } });
    await prisma.testCase.createMany({
      data: q.testCases.map((tc) => ({ ...tc, questionId: q.id })),
    });

    console.log(`Seeded "${q.title}" with ${q.testCases.length} test cases`);
  }
}

main()
  .then(async () => {
    console.log("Seeding complete.");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });