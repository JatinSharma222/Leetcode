import { prisma } from "../src/index";

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