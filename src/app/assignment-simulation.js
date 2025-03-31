import { useState, useEffect } from "react";
import { CadetAssignment } from "../../modules/client/AssignmentSimulation";
import GLPK from 'glpk.js';
export function AssignmentSimulation({ afscs, cadets }) {
  const [results, setResults] = useState({});
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

  async function RunSimulation(){
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
    await simulation.Solve();
    setResults(simulation.results);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Assignment Simulation</h1>
      <p className="mb-4 text-gray-600">Simulate air force specialty code job assignment and view job and cadet properties.</p>
      <div className="mb-6 flex">
      <div className="me-4">
          <label className="block mb-2 text-sm font-medium text-gray-600">
            AFSC Count
          </label>
          <h1 className="text-2xl font-bold mb-1">{afscs.length}</h1>
        </div>
        <div className="me-4">
          <label className="block mb-2 text-sm font-medium text-gray-600">
            Cadet Count
          </label>
          <h1 className="text-2xl font-bold mb-1">{cadets.length}</h1>
        </div>
        <div className="me-4">
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
      </div>
      {/* Statistics of pick rates */}
      <div className="flex">
        <div className="overflow-x-auto mb-4">
          <table className="border-collapse border border-gray-300 me-8">
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
                  <td className="px-4 py-2">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
        <table className="border-collapse border border-gray-300 me-8">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="px-4 py-2 text-left">1st Pref</th>
                <th className="px-4 py-2 text-left">2nd Pref</th>
                <th className="px-4 py-2 text-left">3rd Pref</th>
                <th className="px-4 py-2 text-left">4th Pref</th>
                <th className="px-4 py-2 text-left">5th Pref</th>
                <th className="px-4 py-2 text-left">6th Pref</th>
                <th className="px-4 py-2 text-left">No Pref.</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(results).length === 0 && 
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-4">
                    Run simulation to get results
                  </td>
                </tr>
              }
              {Object.keys(results).length > 0 &&
                <tr>
                  {Object.entries(results).map(([pref, count]) => (
                    <td className="px-4 py-2" key={pref}>{count}</td>
                  ))}
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}