"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface WalkthroughProps {
  onFinish: () => void;
}

const slides = [
  {
    video: "https://xdymta7eafcscakr.public.blob.vercel-storage.com/selectwallet-xPnX26TWadSFMpRoQta8JkiLE4QtT0.mov",
    title: "Connect Solana Wallet",
    description:
      "You need a Solana Wallet in order to invest in the published contracts.",
  },
  {
    video: "https://xdymta7eafcscakr.public.blob.vercel-storage.com/invest-LCVq88doJZdIQY5QRvrO46HZyhYFLo.mov",
    title: "Invest in Pastora’s Published Contracts",
    description:
      "Available contracts will be published when farmlands are ready.",
  },
  {
    video: "https://xdymta7eafcscakr.public.blob.vercel-storage.com/mint-6RusJQVkAVJzGHEk3xf7HuznS9GS1Q.mov",
    title: "Click Mint NFT",
    description:
      "Click Mint NFT in order to track animals in real time!",
  },
];

// Smaller step circles
function StepsIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i === currentStep;
        return (
          <div
            key={i}
            className={`flex items-center justify-center w-10 h-10 rounded-full 
              text-xl font-bold transition-colors
              ${isActive ? "bg-[#7AC78E] text-white" : "bg-gray-400 text-gray-100"}`}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}

export default function Walkthrough({ onFinish }: WalkthroughProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // last slide => "Get Started"
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide === 0) {
      setCurrentSlide(slides.length - 1);
    } else {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center pt-20">
      {/* Skip button in top-right with bigger padding */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-green-600 font-semibold pt-20 pr-10"
      >
        Skip
      </button>

      {/* Title with bigger top margin */}
      <h1 className="text-5xl font-extrabold mb-8 text-center">
        Welcome to Pastora Web3 Smart Contracts
      </h1>

      {/* Step circles (outside the white container) */}
      <StepsIndicator currentStep={currentSlide} totalSteps={slides.length} />

      {/* Main container for the walkthrough content */}
      <div className="w-[750px] h-[620px] bg-white rounded-2xl shadow-lg flex flex-col p-8">
        <h2 className="text-4xl font-bold mb-4 text-center">
          {slides[currentSlide].title}
        </h2>
        <p className="text-xl text-gray-700 mb-4 text-center">
          {slides[currentSlide].description}
        </p>

        {/* Video section */}
        <div className="flex-grow flex items-center justify-center mb-4">
          <video
            key={slides[currentSlide].video}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover rounded-md"
          >
            <source src={slides[currentSlide].video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Navigation buttons at the bottom */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            className="btn btn-outline px-6 py-2 text-sm"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            className="btn text-white px-6 py-2 text-sm"
            style={{ backgroundColor: "#7AC78E" }}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
