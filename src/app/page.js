"use client";

import { useState } from "react";
import AfscEditor from "./afsc-editor";
import { CadetEditor } from "./cadet-editor";
import { AssignmentSimulation } from "./assignment-simulation";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("home");
  const [afscs, setAfscs] = useState([]);
  const [cadets, setCadets] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="py-4">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex space-x-6">
            {/* Home Tab */}
            <li>
              <button
                onClick={() => setSelectedTab("home")}
                className={`py-2 px-4 rounded-md ${selectedTab === "home" ? "bg-[#FFEE8C]" : "hover:bg-[#FFEE8C]"} `}
              >
                Home
              </button>
            </li>
            {/* AFSC Editor Tab */}
            <li>
              <button
                onClick={() => setSelectedTab("afsc-editor")}
                className={`py-2 px-4 rounded-md ${selectedTab === "afsc-editor" ? "bg-[#FF746C]" : "hover:bg-[#FF746C]"} `}
              >
                Air Force Specialty Code Editor
              </button>
            </li>
            {/* Cadet Editor Tab */}
            <li>
              <button
                onClick={() => setSelectedTab("cadet-editor")}
                className={`py-2 px-4 rounded-md ${selectedTab === "cadet-editor" ? "bg-[#B3EBF2]" : "hover:bg-[#B3EBF2]"} `}
              >
                Cadet Editor
              </button>
            </li>
            {/* Assignment Simulation Tab */}
            <li>
              <button
                onClick={() => setSelectedTab("assignment-simulation")}
                className={`py-2 px-4 rounded-md ${selectedTab === "assignment-simulation" ? "bg-[#77DD77]" : "hover:bg-[#77DD77]"} `}
              >
                Assignment Simulation
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow bg-white p-6">
        {/* Home Content */}
        {selectedTab === "home" && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to the USAF assignment mechanism simulation tool</h1>
            <p className="text-lg text-gray-600">
              This is the home page. You can navigate between different sections using the menu above. Refreshing the site will remove all progress.
            </p>
          </div>
        )}

        {/* AFSC Editor Content */}
        {selectedTab === "afsc-editor" && (
          <AfscEditor afscs={afscs} setAfscs={setAfscs} />
        )}

        {/* Cadet Editor Content */}
        {selectedTab === "cadet-editor" && (
          <CadetEditor cadets={cadets} setCadets={setCadets} />
        )}

        {/* Assignment Simulation Content */}
        {selectedTab === "assignment-simulation" && (
          <AssignmentSimulation />
        )}
      </div>
    </div>
  );
}
