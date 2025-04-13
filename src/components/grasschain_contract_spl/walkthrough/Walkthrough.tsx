"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";

const mainGreen = "#7AC78E";

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
    title: "Invest in Pastora's Published Contracts",
    description:
      "Available contracts will be published when farmlands are ready.",
  },
  {
    video: "https://xdymta7eafcscakr.public.blob.vercel-storage.com/mint-6RusJQVkAVJzGHEk3xf7HuznS9GS1Q.mov",
    title: "Click Mint NFT",
    description: "Click Mint NFT in order to track animals in real time!",
  },
];

// Circles at the top
function StepsIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="w-11/12 md:w-[750px] mx-auto flex justify-between items-center mb-4">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i === currentStep;
        return (
          <div
            key={i}
            className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-bold transition-all border 
              ${
                isActive
                  ? "bg-[#7AC78E] text-white"
                  : "bg-white text-[#7AC78E] shadow-inner"
              }`}
            style={isActive ? { boxShadow: `0 0 8px ${mainGreen}` } : {}}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}

const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function Walkthrough({ onFinish }: WalkthroughProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    setDirection(1);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    // If you want to completely disallow going back from the first slide, you can:
    // if (currentSlide === 0) return;
    if (currentSlide === 0) {
      return; // remove this if you want wrap-around behavior
    }
    setCurrentSlide(currentSlide - 1);
  };

  const handleSkip = () => {
    onFinish();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center pt-8 pb-16 overflow-y-auto"
      {...swipeHandlers}
    >
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-2 right-2 text-sm text-[#7AC78E] font-semibold underline"
      >
        Skip
      </button>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="px-4 md:px-8 text-3xl md:text-5xl font-extrabold mb-4 text-center pt-8"
      >
        Welcome to Pastora Web3 Smart Contracts
      </motion.h1>

      <StepsIndicator currentStep={currentSlide} totalSteps={slides.length} />

      {/* Slide wrapper: let the content flow (no absolute) */}
      <div className="w-11/12 md:w-[750px] mb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
            // Use a normal "div" that can grow with content
            className="bg-white rounded-2xl shadow-lg flex flex-col p-4 md:p-8"
            style={{
              boxShadow: "0 4px 20px rgba(122, 199, 142, 0.6)",
            }}
          >
            {/* Slide Title */}
            <h2 className="text-2xl md:text-4xl font-bold mb-2 text-center">
              {slides[currentSlide].title}
            </h2>
            <p className="text-base md:text-xl text-gray-700 mb-4 text-center">
              {slides[currentSlide].description}
            </p>

            {/* Video container */}
            <div className="w-full aspect-video mb-4">
              <video
                key={slides[currentSlide].video}
                autoPlay
                loop
                muted
                playsInline
                // "object-contain" or "object-cover"
                // object-contain => shows entire video with black bars if needed
                // object-cover => fills area but may crop
                className="w-full h-full object-contain rounded-md"
              >
                <source src={slides[currentSlide].video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Buttons row */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrev}
                className="btn btn-outline px-4 py-2 text-sm"
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                className="btn text-white px-4 py-2 text-sm"
                style={{ backgroundColor: mainGreen }}
              >
                {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
