// Import necessary classes
import { Cadet } from '../models/Cadet.js';
import { AFSC } from '../models/Afsc.js';
import { DegreeEnum } from '../models/DegreeEnum.js';
import { CadetAssignment } from '../client/AssignmentSimulation.js';
const cadetData = {
    cadet1: new Cadet(
        "Cadet 1",
        {
            afsc1: 1, // Top choice
            afsc2: 2,
            afsc3: 3
        },
        0.95, // 95th percentile
        true, // From USAFA
        {
            afsc1: DegreeEnum.MANDATORY,
            afsc2: DegreeEnum.DESIRED,
            afsc3: DegreeEnum.PERMITTED
        }
    ),
    cadet2: new Cadet(
        "Cadet 2",
        {
            afsc1: 2,
            afsc2: 1, // Top choice
            afsc3: 3
        },
        0.87, // 87th percentile
        false, // Not from USAFA
        {
            afsc1: DegreeEnum.DESIRED,
            afsc2: DegreeEnum.MANDATORY,
            afsc3: DegreeEnum.PERMITTED
        }
    ),
    cadet3: new Cadet(
        "Cadet 3",
        {
            afsc1: 3,
            afsc2: 1,
            afsc3: 2
        },
        0.65, // 65th percentile
        true, // From USAFA
        {
            afsc1: DegreeEnum.PERMITTED,
            afsc2: DegreeEnum.MANDATORY,
            afsc3: DegreeEnum.DESIRED
        }
    ),
    cadet4: new Cadet(
        "Cadet 4",
        {
            afsc1: 1,
            afsc2: 2,
            afsc3: 3
        },
        0.45, // 45th percentile
        false, // Not from USAFA
        {
            afsc1: DegreeEnum.DESIRED,
            afsc2: DegreeEnum.PERMITTED,
            afsc3: DegreeEnum.MANDATORY
        }
    )
};

// === Sample AFSCs ===
const afscData = {
    afsc1: new AFSC(
        "afsc1", // Code of the AFSC
        2, // Minimum of 2 cadets assigned
        1.2, // Can overclassify by 20%
        { min: 0, max: 1 }, // 40-80% mandatory degree bounds
        { min: 0, max: 1 }, // 20-50% USAFA cadets bounds
        { min: 0, max: 1 } // 30-70% merit bounds
    ),
    afsc2: new AFSC(
        "afsc2", // Code of the AFSC
        1, // Minimum of 1 cadet assigned
        1.1, // Can overclassify by 10%
        { min: 0, max: 1 }, // 40-80% mandatory degree bounds
        { min: 0, max: 1 }, // 20-50% USAFA cadets bounds
        { min: 0, max: 0.5 } // 30-70% merit bounds
    ),
    afsc3: new AFSC(
        "afsc3", // Code of the AFSC
        1, // Minimum of 1 cadet assigned
        1.3, // Can overclassify by 30%
        { min: 0, max: 1 }, // 40-80% mandatory degree bounds
        { min: 0, max: 1 }, // 20-50% USAFA cadets bounds
        { min: 0.7, max: 1 } // 30-70% merit bounds
    )
};

// === Simulation Settings ===
const deviationPenalty = -1000; // Penalty for assignment mismatch or infeasibility

// === Run the Simulation ===
console.log('🎯 Initializing Cadet Assignment Simulation...');
const simulation = new CadetAssignment(cadetData, afscData, deviationPenalty);

// === Solve and Display Results ===
console.log('🚀 Solving LP Optimization...');
simulation.Solve();