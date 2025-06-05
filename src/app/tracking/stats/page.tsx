"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RANCH_ID = "89228e7c-6e99-492e-b085-b06edfc731b5";
const LOT_ID = "88638ee6-9279-415f-8584-5c660a2cd907";

export default function StatsPage() {
  const { selectedLote } = useLote();
  const [animalsData, setAnimalsData] = useState<any[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  // On mount or if user changes "lote," fetch animals for the selected lot
  useEffect(() => {
    fetch(`/api/lots/${RANCH_ID}/${LOT_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error fetching animals: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // The lot endpoint nests animals under `data.animals`
        const list = data?.data?.animals ?? data?.animals ?? [];
        setAnimalsData(list);
      })
      .catch((err) => {
        console.error("Stats fetch error", err);
      });
  }, [selectedLote]);

  // The API already returns animals for the given lot
  const filteredAnimals = animalsData;

  function handleSelectAnimal(name: string) {
    setSelectedAnimal((prev) => (prev === name ? null : name));
  }

  // For the chart
  const showAnimalGraph = selectedAnimal !== null;
  const selectedObj = filteredAnimals.find((a) => a.name === selectedAnimal);

  function getWeightHistory(an: any) {
    if (an.lastWeight) {
      // Example: older, mid, last
      return [an.lastWeight.weight - 15, an.lastWeight.weight - 5, an.lastWeight.weight];
    }
    return [250, 260, 270];
  }

  const animalChartData = {
    labels: ["Day 1", "Day 2", "Day 3"],
    datasets: [
      {
        label: `Peso de ${selectedAnimal || ""}`,
        data: selectedObj ? getWeightHistory(selectedObj) : [],
        borderColor: "rgb(75, 192, 192)",
        fill: false,
      },
    ],
  };

  const day1 = filteredAnimals.map((a) => getWeightHistory(a)[0]);
  const day2 = filteredAnimals.map((a) => getWeightHistory(a)[1]);
  const day3 = filteredAnimals.map((a) => getWeightHistory(a)[2]);
  const avg = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0) / (arr.length || 1);

  const loteChartData = {
    labels: ["Day 1", "Day 2", "Day 3"],
    datasets: [
      {
        label: "Promedio Lote",
        data: [avg(day1), avg(day2), avg(day3)],
        borderColor: "rgb(255, 99, 132)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen w-full bg-gray-800 text-white">
      <div className="ml-[271px] pt-10 flex flex-col md:flex-row">
        {/* LEFT: List of animals */}
        <div
          className="
            w-[350px] p-4
            mt-[50px]
            max-h-[calc(100vh-105px)]
            overflow-y-auto
          "
        >
          <ul className="space-y-3">
            {filteredAnimals.map((animal) => {
              const isSelected = animal.name === selectedAnimal;
              return (
                <li
                  key={animal.id}
                  onClick={() => handleSelectAnimal(animal.name)}
                  className={`
                    cursor-pointer rounded-[20px] px-4 py-3 text-lg
                    flex items-center justify-between
                    ${
                      isSelected
                        ? "bg-green-200 text-gray-800 font-semibold"
                        : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
                >
                  <span>{animal.name}</span>
                  {animal.lastWeight && (
                    <span className="ml-2 text-sm text-gray-600">
                      {animal.lastWeight.weight} kg
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* RIGHT: Graphs */}
        <div className="flex-1 mr-4">
          {/* Single animal graph */}
          {showAnimalGraph && selectedObj && (
            <div className="bg-white text-gray-700 rounded-[20px] p-4 my-4">
              <h2 className="text-xl font-bold mb-4">Ganancia de peso: {selectedObj.name}</h2>
              <div className="h-64 w-full relative">
                <Line data={animalChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Lote average graph */}
          <div className="bg-white text-gray-700 rounded-[20px] p-4 my-4">
            <h2 className="text-xl font-bold mb-4">Gráfico del Lote</h2>
            <div className="h-64 w-full relative">
              <Line data={loteChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
