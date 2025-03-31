import { useState, useEffect } from "react";
import { CadetAssignment } from "../../modules/client/AssignmentSimulation";
import GLPK from 'glpk.js';
export function AssignmentSimulation({ afscs, cadets }) {
  const [preferenceCount, setPreferenceCount] = useState({});
  const [glpkInstance, setGlpkInstance] = useState(null); // Store the GLPK instance once it's loaded

  useEffect(() =>{
    async function loadGLPK() {
      try {
        const instance = await GLPK(); // Wait for glpk.js to initialize
        setGlpkInstance(instance); // Set the glpk instance when it's ready
      } catch (error) {
        console.error("Failed to load GLPK:", error);
      }
    }

    loadGLPK();

    if (cadets.length < 1) {
      return;
    }

    const prefCount = {};
    for (let cadet of cadets) {
      const preferences = cadet.cadetPreferences;
      for (let afsc in preferences) {
          if (prefCount[afsc]) {
            prefCount[afsc]++; // Increment count if AFSC already exists
          } else {
            prefCount[afsc] = 1; // Initialize count if it's the first occurrence
          }
      }
    }
    // Convert the preference count object to an array and sort by count (highest to lowest)
    const sortedPreferences = Object.entries(prefCount)
    .sort((a, b) => b[1] - a[1]); // Sort based on the second element (count), descending

    // Convert sorted array back to an object (optional, depending on your use case)
    const sortedPreferenceCount = Object.fromEntries(sortedPreferences);
    // Update state or variable with sorted preferences
    setPreferenceCount(sortedPreferenceCount);
  }, [])

  function RunSimulation(){
    if (!glpkInstance) {
      console.log("GLPK is still loading...");
      return; // Don't run simulation if GLPK isn't ready
    }

    const deviationPenalty = -50000;
    // Put afscs and cadets into objects
    let cadetData = {};
    let afscData = {};
    for (let cadet of cadets) {
      cadetData[cadet.name] = cadet;
    }
    for (let afsc of afscs) {
      afscData[afsc.afsc] = afsc;
    }

    const simulation = new CadetAssignment(cadetData, afscData, deviationPenalty, glpkInstance);
    simulation.Solve();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Assignment Simulation</h1>
      <p className="mb-4 text-gray-600">Simulate air force specialty code job assignment and view job and cadet properties.</p>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-600">
          Run simulation with current AFSCs and cadets
        </label>
        <button
          onClick={() => {RunSimulation()}}
          disabled={afscs.length === 0 || cadets === 0}
          className="p-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Simulate
        </button>
      </div>
      {/* Statistics of pick rates */}
      <div>
        <table>
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="px-4 py-2 text-left">AFSC</th>
              <th className="px-4 py-2 text-left">Preference Count</th>
            </tr>
          </thead>
          <tbody>
            {cadets.length === 0 && 
              <tr>
                <td colSpan="2" className="text-center text-gray-500 py-4">
                    No cadet data.
                </td>
              </tr>
            }
            {cadets.length > 0 && Object.entries(preferenceCount).map(([afsc, count], index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-200"
                  } hover:bg-green-100`}
              >
                <td className="px-4 py-2">{afsc}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}