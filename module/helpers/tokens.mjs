/**
 * This module contains utility functions for querying and manipulating tokens.
 */

/**
 * Given an array of numbered tokens on the canvas, find the next available number to assign
 * @param {*} matchingTokens 
 * @returns 
 */
export function getAvailableTokenNumber(matchingTokens) {
    // Get a sorted array of numbers being used by the array of tokens
    const numbers = matchingTokens
        .map(t => {
            const match = t.name.match(/\((\d+)\)/);
            return match ? parseInt(match[1], 10) : null;
        })
        .sort((a, b) => a - b);
    // Now, iterate through the numeric array to find either a gap in sequence that we can fill, 
    //  or just the next available integer
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
            return i + 1;
        }
    }
    return numbers.length + 1;
}
