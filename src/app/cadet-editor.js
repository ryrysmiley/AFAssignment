
import { useState } from "react";
import { importCadets } from "../../modules/client/ImportCsv";
import { DegreeEnum } from "../../modules/models/DegreeEnum";
import * as XLSX from "xlsx";
import { GenerateCadets } from "../../modules/client/CadetGeneration";

export function CadetEditor({cadets, setCadets, afscs}) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;  // You can change this to adjust how many rows per page.
    
    // Function to handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // Use the first sheet
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                setCadets(importCadets(csv)); // Save the CSV data
            };
            reader.readAsArrayBuffer(file);
        }
        event.target.value = null; // Clear the file input
    }

    // Function to export Cadets 
    function exportCadets(cadets) {
        const exportData = cadets.map((cadet) => {
            const prefReorder = {};
            Object.entries(cadet.cadetPreferences).forEach(([key, value]) => {
                prefReorder[value] = key;
            });

            return {
                name: cadet.name,
                p1: prefReorder[1] || "",
                p2: prefReorder[2] || "",
                p3: prefReorder[3] || "",
                p4: prefReorder[4] || "",
                p5: prefReorder[5] || "",
                p6: prefReorder[6] || "",
                percentile: cadet.cadetPercentile,
                usafa_origin: cadet.cadetFromUSAFA ? "TRUE" : "FALSE",
                mandatory_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.MANDATORY)
                    .map(([key]) => key).join("|"),
                desired_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.DESIRED)
                    .map(([key]) => key).join("|"),
                permitted_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.PERMITTED)
                    .map(([key]) => key).join("|")
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cadets");
        const fileName = "cadets.xlsx";
        XLSX.writeFile(workbook, fileName);
    }

    // Function to add a new cadet
    function addCadet() {
        const newCadet = {
            name: "",
            cadetPreferences: {
                1: "",
                2: "",
                3: "",
                4: "",
                5: "",
                6: ""
            },
            cadetPercentile: 0,
            cadetFromUSAFA: false,
            cadetDegrees: {
                "": DegreeEnum.PERMITTED // Initialize with an empty degree
            }
        };
        setCadets([...cadets, newCadet]); // Add the new cadet to the list
    }

    // Create cadets based on afscs' properties
    function CreateAFSCBasedCadets(){
        const newCadets = GenerateCadets(afscs);
        setCadets(newCadets)
    }

    // Function to delete a cadet
    function deleteCadet(index) {
        const newCadets = [...cadets];
        newCadets.splice(index, 1); // Remove the cadet at the specified index
        setCadets(newCadets); // Update the state with the new cadet list
    }

    // Calculate the start and end index for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    const currentCadets = cadets.slice(startIndex, endIndex);

    const totalPages = Math.ceil(cadets.length / itemsPerPage);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Cadet Editor</h1>
            <p className="mb-4 text-gray-600">Manage cadets and their parameters.</p>
            <div className="mb-6 flex">
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Import Cadet File (Will overwrite existing cadets)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none"
                    />
                </div>
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Export cadets to file
                    </label>
                    <button
                        onClick={() => {exportCadets(cadets)}}
                        disabled={cadets.length === 0}
                        className="p-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Export Cadets
                    </button>
                </div>
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        New cadet
                    </label>
                    <button
                        onClick={() => {addCadet()}}
                        className="p-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
                    >
                        Add Cadet
                    </button>
                </div>
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Delete all cadets
                    </label>
                    <button
                        onClick={() => {setCadets([])}}
                        disabled={cadets.length === 0}
                        className="p-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Clear Cadets
                    </button>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Generate cadets from AFSCs' weighted distribution
                    </label>
                    <button
                        onClick={() => {CreateAFSCBasedCadets()}}
                        disabled={afscs.length < 6}
                        className="p-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Generate Cadets
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto mb-4">
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-blue-700 text-white">
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Preferences</th>
                            <th className="px-4 py-2 text-left">Percentile</th>
                            <th className="px-4 py-2 text-left">USAFA Graduate</th>
                            <th className="px-4 py-2 text-left">Degrees</th>
                            <th className="px-4 py-2 text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCadets.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center text-gray-500 py-4">
                                    No cadets created. Please add cadets to get started.
                                </td>
                            </tr>
                        )}
                        {currentCadets.map((cadet, index) => (
                            <tr
                            key={index}
                            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-200"
                                } hover:bg-red-100`}
                            >
                                {/* Make all cadets editable */}
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={cadet.name}
                                        onChange={(e) => {
                                            const newCadets = [...cadets];
                                            newCadets[index].name = e.target.value;
                                            setCadets(newCadets);
                                        }}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    {/*list of preferences editable comma separated*/}
                                    <input
                                        type="text"
                                        defaultValue={Object.keys(cadet.cadetPreferences).join(", ")}
                                        onBlur={(e) => {
                                            const newCadets = [...cadets];
                                            const preferences = e.target.value
                                                .split(",")
                                                .map((pref) => pref.trim())
                                            const newPreferences = {};
                                            preferences.forEach((pref, index) => {
                                                if(index > 5) return; // Limit to 6 preferences
                                                newPreferences[pref] = index + 1;
                                            });
                                            newCadets[index].cadetPreferences = newPreferences;
                                            setCadets(newCadets);
                                        }}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={cadet.cadetPercentile}
                                        onChange={(e) => {
                                            const newCadets = [...cadets];
                                            newCadets[index].cadetPercentile = e.target.value;
                                            setCadets(newCadets);
                                        }}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    {/* from usafa switch */}
                                    <input
                                        type="checkbox"
                                        checked={cadet.cadetFromUSAFA}
                                        onChange={(e) => {
                                            const newCadets = [...cadets];
                                            newCadets[index].cadetFromUSAFA = e.target.checked;
                                            setCadets(newCadets);
                                        }}
                                        className="w-4 h-4 cursor-pointer border-4 border-blue-500 rounded-md accent-blue-500 checked:bg-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2 max-w-xs overflow-x-auto whitespace-normal">
                                    <input
                                        type="text"
                                        defaultValue={
                                            Object.entries(cadet.cadetDegrees)
                                                .map(([degree, value]) => `${degree}: ${value}`)
                                                .join(", ")
                                        }
                                        onBlur={(e) => {
                                            // split into commas and get the colon split
                                            const newCadets = [...cadets];
                                            const degrees = e.target.value
                                                .split(",")
                                                .map((degree) => degree.trim())
                                                .filter((degree) => degree !== ""); // Filter out empty strings
                                            const newDegrees = {};
                                            degrees.forEach((degree) => {
                                                const [key, value] = degree.split(":").map((d) => d.trim());
                                                if (key && value) {
                                                    newDegrees[key] = 
                                                    value !== "Mandatory" || 
                                                    value !== "Desired" || 
                                                    value !== "Permitted" ? value : DegreeEnum.PERMITTED; // Assign the degree and its value
                                                }
                                            });
                                            newCadets[index].cadetDegrees = newDegrees;
                                            console.log(newCadets[index].cadetDegrees);
                                        }}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border w-full"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <button onClick={() => deleteCadet(index)}>
                                        <span className="text-blue-500 text-md font-bold hover:text-blue-700 active:text-blue-800">✖</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {cadets.length !== 0 &&
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1 || cadets.length === 0}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700">{`Page ${currentPage} of ${totalPages}`}</span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages || cadets.length === 0}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            }
        </div>
    );
}