import { Cadet } from "../models/Cadet";
import { DegreeEnum } from "../models/DegreeEnum";

// function to generate cadets based on afscs target, afscs overclassification factor, and afscs weighted distribution | using weighted sampling
export function GenerateCadets(afscs){
    // determine number of cadets to create between target sum and target * overclassification sum
    const numCadets = getCalculatedCadetCount(afscs);
    // create cumulative weights
    const cumulativeWeights = createCumulativeWeights(afscs);
    // create cadet and preferences
    let cadetList = [];
    for (let i = 0; i <= numCadets; ++i){
        const preferences = generatePreferences(cumulativeWeights);
        const degrees = generateDegrees(preferences);
        const percentile = Math.random().toFixed(3);
        const usafaCadet = Math.random() < 0.5;
        cadetList.push(new Cadet(
            `Cadet ${i+1}`,
            preferences,
            percentile,
            usafaCadet,
            degrees
        ));
    }
    return cadetList;
}

// Generate preferences based on cumulative weights
function generatePreferences(cumulativeWeights, numChoices = 6) {
    const chosen = new Set();
    const preferences = {};

    // Keep picking until we have 6 unique choices
    while (chosen.size < numChoices) {
        const choice = weightedRandomChoice(cumulativeWeights);
        if (!chosen.has(choice)) {
            chosen.add(choice);
            preferences[choice] = chosen.size; // Assign preference rank (1 to 6)
        }
    }
    return preferences;
}

// Generate degrees randomly based on preferences
function generateDegrees(preferences){
    const degrees = {};
    const potentialDegrees = [DegreeEnum.MANDATORY,  DegreeEnum.DESIRED, DegreeEnum.PERMITTED]
    for (let preference in Object.keys(preferences)) {
        const randomIndex = Math.floor(Math.random() * 3);
        degrees[preference] = potentialDegrees[randomIndex];
    }
    return degrees;
}

// Generate random number of cadets based on min-max of target * overclassification factor
function getCalculatedCadetCount(afscs) {
    let minCadets = 0, maxCadets = 0;
    for (let key in afscs) {
        const afsc = afscs[key];
        const total = afsc.target * afsc.overclassFactor;
        minCadets += Math.floor(total);
        maxCadets += Math.ceil(total);
    }
    // Random number between min and max
    return Math.floor(Math.random() * (maxCadets - minCadets + 1)) + minCadets;
}

// Create cumulative weights for sampling
function createCumulativeWeights(afscs) {
    const cumulative = [];
    let sum = 0;
    for (let code in Object.keys(afscs)) {
        const afsc = afscs[code];
        sum += afsc.weightedDistribution;
        cumulative.push({ name: afsc.afsc, cumulativeWeight: sum });
    }
    return cumulative;
}

// Weighted random selection using cumulative weights
function weightedRandomChoice(cumulativeWeights) {
    const totalWeight = cumulativeWeights[cumulativeWeights.length - 1].cumulativeWeight;
    const rand = Math.random() * totalWeight;

    for (let i = 0; i < cumulativeWeights.length; i++) {
        if (rand < cumulativeWeights[i].cumulativeWeight) {
            return cumulativeWeights[i].name;
        }
    }
}