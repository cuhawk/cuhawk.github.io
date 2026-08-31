# Bitwise

Bit manipulation involves the direct manipulation of bits, which can be a very efficient way to perform operations on binary data. In C++, bit manipulation can be done using bitwise operators. Here’s a detailed guide on bit manipulation with examples in C++.

### Bitwise Operators in C++

1. **AND (`&`)**
2. This operator performs a bitwise AND operation.
3. Example: `5 & 3` results in `1` because in binary `5` is `0101` and `3` is `0011`.
4. **OR (`|`)**
5. This operator performs a bitwise OR operation.
6. Example: `5 | 3` results in `7` because in binary `5` is `0101` and `3` is `0011`.
7. **XOR (`^`)**
8. This operator performs a bitwise XOR operation.
9. Example: `5 ^ 3` results in `6` because in binary `5` is `0101` and `3` is `0011`.
10. **NOT (`~`)**
11. This operator performs a bitwise NOT operation.
12. Example: `~5` results in `-6` because in binary `5` is `0101` and its bitwise NOT is `1010` which is `-6` in two's complement representation.
13. **Left Shift (`<<`)**
14. This operator shifts the bits of the first operand left by the number of positions specified by the second operand.
15. Example: `5 << 1` results in `10` because in binary `5` is `0101` and shifting left by 1 bit results in `1010`.
16. **Right Shift (`>>`)**
17. This operator shifts the bits of the first operand right by the number of positions specified by the second operand.
18. Example: `5 >> 1` results in `2` because in binary `5` is `0101` and shifting right by 1 bit results in `0010`.

### Practical Examples

#### Example 1: Checking if a Number is Even or Odd

```
#include <iostream>

int main() {
    int num = 5;
    if (num & 1) {
        std::cout << num << " is odd" << std::endl;
    } else {
        std::cout << num << " is even" << std::endl;
    }
    return 0;
}
```

In this example, the least significant bit is checked to determine if the number is odd or even.

#### Example 2: Swapping Two Numbers Without a Temporary Variable

```
#include <iostream>

int main() {
    int a = 5, b = 3;
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    std::cout << "a: " << a << ", b: " << b << std::endl;
    return 0;
}
```

This example uses the XOR operator to swap the values of `a` and `b` without using a temporary variable.

#### Example 3: Counting Set Bits in an Integer

```
#include <iostream>

int countSetBits(int num) {
    int count = 0;
    while (num) {
        count += num & 1;
        num >>= 1;
    }
    return count;
}

int main() {
    int num = 29; // Binary: 11101
    std::cout << "Number of set bits: " << countSetBits(num) << std::endl;
    return 0;
}
```

This function counts the number of 1's (set bits) in the binary representation of an integer.

#### Example 4: Reversing Bits of an Integer

```
#include <iostream>

unsigned int reverseBits(unsigned int num) {
    unsigned int count = sizeof(num) * 8 - 1;
    unsigned int reverse_num = num;

    num >>= 1;
    while (num) {
        reverse_num <<= 1;
        reverse_num |= num & 1;
        num >>= 1;
        count--;
    }
    reverse_num <<= count; // Shift when num is zero

    return reverse_num;
}

int main() {
    unsigned int x = 1; // Binary: 00000000000000000000000000000001
    std::cout << reverseBits(x) << std::endl; // Output: 2147483648 (Binary: 10000000000000000000000000000000)
    return 0;
}
```

This function reverses the bits in an integer.

### Bit Manipulation Tricks

1. **Isolating the Rightmost 1-bit**:

   ```
   int x = 12; // Binary: 1100
   int rightmost_one = x & -x; // Result: 4 (Binary: 0100)
   ```
2. **Setting the Rightmost 0-bit to 1**:

   ```
   int x = 12; // Binary: 1100
   int set_rightmost_zero = x | (x + 1); // Result: 13 (Binary: 1101)
   ```
3. **Clearing the Rightmost 1-bit**:

   ```
   int x = 12; // Binary: 1100
   int clear_rightmost_one = x & (x - 1); // Result: 8 (Binary: 1000)
   ```
4. **Checking if a Number is a Power of 2**:

   ```
   bool isPowerOfTwo(int x) {
       return x && !(x & (x - 1));
   }
   ```

These examples and tricks cover the fundamental concepts of bit manipulation in C++. Mastering these operations can significantly enhance the efficiency and performance of your code in specific scenarios.

### Bitwise Operations: Use Cases, Properties, and Laws

#### Multiplication and Division using Bitwise Operations

**Multiplication by Powers of Two:**
Bitwise left shift (`<<`) can be used to multiply a number by powers of two efficiently.

Example:

```
#include <iostream>

int main() {
    int num = 5;
    int result = num << 1; // Equivalent to 5 * 2^1 = 10
    std::cout << "5 << 1 = " << result << std::endl;

    result = num << 2; // Equivalent to 5 * 2^2 = 20
    std::cout << "5 << 2 = " << result << std::endl;

    return 0;
}
```

**Division by Powers of Two:**
Bitwise right shift (`>>`) can be used to divide a number by powers of two efficiently.

Example:

```
#include <iostream>

int main() {
    int num = 20;
    int result = num >> 1; // Equivalent to 20 / 2^1 = 10
    std::cout << "20 >> 1 = " << result << std::endl;

    result = num >> 2; // Equivalent to 20 / 2^2 = 5
    std::cout << "20 >> 2 = " << result << std::endl;

    return 0;
}
```

#### Commutative and Associative Laws

- **Commutative Law:**
- `A & B = B & A`
- `A | B = B | A`
- `A ^ B = B ^ A`
- **Associative Law:**
- `(A & B) & C = A & (B & C)`
- `(A | B) | C = A | (B | C)`
- `(A ^ B) ^ C = A ^ (B ^ C)`

#### Distributive Law

- `A & (B | C) = (A & B) | (A & C)`
- `A | (B & C) = (A | B) & (A | C)`

#### Identity Law

- `A & 0 = 0`
- `A | 0 = A`
- `A ^ 0 = A`

#### Null Law

- `A & A = A`
- `A | A = A`
- `A ^ A = 0`

#### Idempotent Law

- `A & A = A`
- `A | A = A`

#### Inverse Law

- `A & ~A = 0`
- `A | ~A = ~0` (All bits set to 1)

#### Complement and Inverse

**Complement:**
The bitwise complement operator (`~`) inverts all the bits of its operand.

Example:

```
#include <iostream>

int main() {
    int num = 5; // Binary: 0000 0101
    int result = ~num; // Binary: 1111 1010
    std::cout << "~5 = " << result << std::endl; // Output will be -6 in two's complement representation
    return 0;
}
```

**Inverse:**
The concept of inverse in bitwise operations is often represented by the XOR operation with the number itself, resulting in zero.

Example:

```
#include <iostream>

int main() {
    int num = 5; // Binary: 0000 0101
    int result = num ^ num; // Binary: 0000 0000
    std::cout << "5 ^ 5 = " << result << std::endl; // Output will be 0
    return 0;
}
```

### Use Cases of Bitwise Operations

1. **Setting a Bit:**
   To set a specific bit, use the OR operator (`|`).

   ```
   int num = 5; // Binary: 0101
   int bit_position = 1;
   num |= (1 << bit_position); // Set bit at position 1: Result is 7 (Binary: 0111)
   ```
2. **Clearing a Bit:**
   To clear a specific bit, use the AND operator (`&`) with the NOT operator (`~`).

   ```
   int num = 5; // Binary: 0101
   int bit_position = 0;
   num &= ~(1 << bit_position); // Clear bit at position 0: Result is 4 (Binary: 0100)
   ```
3. **Toggling a Bit:**
   To toggle a specific bit, use the XOR operator (`^`).

   ```
   int num = 5; // Binary: 0101
   int bit_position = 2;
   num ^= (1 << bit_position); // Toggle bit at position 2: Result is 1 (Binary: 0001)
   ```
4. **Checking a Bit:**
   To check if a specific bit is set, use the AND operator (`&`).

   ```
   int num = 5; // Binary: 0101
   int bit_position = 2;
   bool is_set = num & (1 << bit_position); // Check bit at position 2: Result is true (1)
   ```
5. **Extracting the Rightmost Set Bit:**
   To isolate the rightmost set bit.

   ```
   int num = 12; // Binary: 1100
   int rightmost_set_bit = num & -num; // Result is 4 (Binary: 0100)
   ```
6. **Clearing the Rightmost Set Bit:**
   To clear the rightmost set bit.

   ```
   int num = 12; // Binary: 1100
   num = num & (num - 1); // Result is 8 (Binary: 1000)
   ```

#### Special Cases

1. **Multiplying and Dividing by Powers of Two**:
2. Multiplication by (2^n) is equivalent to left shifting by (n).
3. Division by (2^n) is equivalent to right shifting by (n).
4. These operations are very efficient because shifting bits is faster than multiplication and division.
5. **Detecting Overflow**:
6. When performing bitwise shifts, care must be taken to avoid overflow.
7. Example: Left shifting a bit pattern that extends beyond the size of the type can lead to unexpected results.
8. **Bitwise NOT and Two's Complement**:
9. The bitwise NOT operation inverts all bits and is related to the two's complement representation used for negative numbers.
10. Example: The bitwise NOT of an integer (x) is (-x-1).
11. **Bitwise AND with Zero**:
12. Any number ANDed with zero results in zero.
13. Example: ( x & 0 = 0 ).
14. **Bitwise OR with Zero**:
15. Any number ORed with zero remains unchanged.
16. Example: ( x | 0 = x ).
17. **Bitwise XOR with Self**:
18. Any number XORed with itself results in zero.
19. Example: ( x ^ x = 0 ).
20. **Bitwise XOR with Zero**:
21. Any number XORed with zero remains unchanged.
22. Example: ( x ^ 0 = x ).

#### Examples

**Example 1: Isolating the Rightmost Set Bit**

To isolate the rightmost set bit (the rightmost 1-bit):

```
#include <iostream>

int main() {
    int num = 12; // Binary: 1100
    int rightmost_set_bit = num & -num; // Result is 4 (Binary: 0100)
    std::cout << "Rightmost set bit: " << rightmost_set_bit << std::endl;
    return 0;
}
```

Explanation:
- The expression `num & -num` isolates the rightmost set bit. `-num` is the two's complement of `num`.

**Example 2: Clearing the Rightmost Set Bit**

To clear the rightmost set bit:

```
#include <iostream>

int main() {
    int num = 12; // Binary: 1100
    num = num & (num - 1); // Result is 8 (Binary: 1000)
    std::cout << "After clearing rightmost set bit: " << num << std::endl;
    return 0;
}
```

Explanation:
- The expression `num & (num - 1)` clears the rightmost set bit.

**Example 3: Checking if a Number is a Power of Two**

To check if a number is a power of two:

```
#include <iostream>

bool isPowerOfTwo(int num) {
    return num > 0 && (num & (num - 1)) == 0;
}

int main() {
    int num = 16;
    if (isPowerOfTwo(num)) {
        std::cout << num << " is a power of two." << std::endl;
    } else {
        std::cout << num << " is not a power of two." << std::endl;
    }
    return 0;
}
```

Explanation:
- A number is a power of two if it has exactly one set bit. The expression `(num & (num - 1)) == 0` checks this condition.

**Example 4: Counting the Number of Set Bits**

To count the number of set bits in an integer:

```
#include <iostream>

int countSetBits(int num) {
    int count = 0;
    while (num) {
        count += num & 1;
        num >>= 1;
    }
    return count;
}

int main() {
    int num = 29; // Binary: 11101
    std::cout << "Number of set bits: " << countSetBits(num) << std::endl;
    return 0;
}
```

Explanation:
- The function iterates through all bits of `num`, incrementing the count whenever the least significant bit is set.

**Example 5: Swapping Two Numbers Using XOR**

To swap two numbers without using a temporary variable:

```
#include <iostream>

int main() {
    int a = 5, b = 3;
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    std::cout << "After swapping: a = " << a << ", b = " << b << std::endl;
    return 0;
}
```

Explanation:
- XOR operations are used to swap the values of `a` and `b` without a temporary variable.

**Example 6: Finding the Most Significant Set Bit**

To find the position of the most significant set bit:

```
#include <iostream>

int findMSB(int num) {
    int msb = -1;
    while (num) {
        num >>= 1;
        msb++;
    }
    return msb;
}

int main() {
    int num = 18; // Binary: 10010
    std::cout << "Most significant set bit position: " << findMSB(num) << std::endl;
    return 0;
}
```

Explanation:
- The function shifts the number right until it becomes zero, counting the number of shifts to determine the position of the most significant set bit.

### Conclusion

Bitwise operations provide a powerful and efficient way to manipulate individual bits within an integer. They have special cases and properties that make them useful for various applications, including setting, clearing, and toggling bits, checking conditions, and performing arithmetic operations. Understanding these operations and their use cases can lead to more optimized and elegant solutions in programming.
