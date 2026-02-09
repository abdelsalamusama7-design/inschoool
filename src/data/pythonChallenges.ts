export interface PythonChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  starterCode: string;
  hint?: string;
}

export const pythonChallenges: PythonChallenge[] = [
  {
    id: 'hello',
    title: 'Hello World',
    description: 'Print "Hello, World!" to the console.',
    difficulty: 'beginner',
    starterCode: '# Write your first Python program!\nprint("Hello, World!")',
    hint: 'Use the print() function to display text.',
  },
  {
    id: 'variables',
    title: 'Variables & Math',
    description: 'Create two variables, add them together, and print the result.',
    difficulty: 'beginner',
    starterCode: '# Create two number variables and add them\na = 10\nb = 20\nresult = a + b\nprint(f"{a} + {b} = {result}")',
    hint: 'Use f-strings to format your output nicely.',
  },
  {
    id: 'loop',
    title: 'Counting Loop',
    description: 'Use a for loop to print numbers from 1 to 10.',
    difficulty: 'beginner',
    starterCode: '# Print numbers 1 to 10 using a loop\nfor i in range(1, 11):\n    print(i)',
    hint: 'range(1, 11) gives you numbers from 1 to 10.',
  },
  {
    id: 'list',
    title: 'Favorite Colors',
    description: 'Create a list of your favorite colors and print each one.',
    difficulty: 'beginner',
    starterCode: '# Create a list of colors and print them\ncolors = ["Red", "Blue", "Green", "Yellow"]\n\nfor color in colors:\n    print(f"I like {color}!")',
    hint: 'Lists use square brackets [] and you can loop through them.',
  },
  {
    id: 'function',
    title: 'My First Function',
    description: 'Create a function that takes a name and returns a greeting.',
    difficulty: 'intermediate',
    starterCode: '# Create a greeting function\ndef greet(name):\n    return f"Hello, {name}! Welcome to Python!"\n\n# Test your function\nprint(greet("Student"))\nprint(greet("Teacher"))',
    hint: 'Use def to define a function and return to send back a value.',
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz Challenge',
    description: 'Print numbers 1-20. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz".',
    difficulty: 'intermediate',
    starterCode: '# FizzBuzz Challenge!\nfor i in range(1, 21):\n    if i % 3 == 0 and i % 5 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
    hint: 'Use the modulo operator (%) to check divisibility.',
  },
  {
    id: 'dictionary',
    title: 'Student Grades',
    description: 'Create a dictionary of student names and grades, then calculate the average.',
    difficulty: 'intermediate',
    starterCode: '# Student grades dictionary\ngrades = {\n    "Ahmed": 95,\n    "Sara": 88,\n    "Omar": 92,\n    "Layla": 97\n}\n\n# Print each student\'s grade\nfor name, grade in grades.items():\n    print(f"{name}: {grade}")\n\n# Calculate average\naverage = sum(grades.values()) / len(grades)\nprint(f"\\nClass Average: {average:.1f}")',
    hint: 'Dictionaries use curly braces {} with key: value pairs.',
  },
  {
    id: 'pattern',
    title: 'Star Pattern',
    description: 'Print a triangle pattern using stars (*).',
    difficulty: 'advanced',
    starterCode: '# Print a star triangle pattern\nrows = 5\n\nfor i in range(1, rows + 1):\n    spaces = " " * (rows - i)\n    stars = "* " * i\n    print(spaces + stars)',
    hint: 'Use string multiplication to create repeated characters.',
  },
];
