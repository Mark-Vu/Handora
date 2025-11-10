export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 900;

export const DINO_GAME_HEIGHT = 450;
export const DINO_GAME_WIDTH = 900;

export function calculateAverage(numbers) {
    if (numbers.length === 0) {
        return 0; // Handle empty array case
    }
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i];
    }
    return sum / numbers.length;
}
