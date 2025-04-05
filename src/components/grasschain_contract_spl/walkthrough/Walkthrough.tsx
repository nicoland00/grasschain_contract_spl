"use client";
import React, { useState } from "react";

interface WalkthroughProps {
  onFinish: () => void;
}

const slides = [
  {
    image: "/1 (1).png",
    title: "Connect Solana Wallet",
    description:
      "You need a Solana Wallet in order to invest in the published contracts",
  },
  {
    image: "/2 (1).png",
    title: "Click Invest on Pastora’s certified published contracts",
    description:
      "Available contracts will be published when farmlands are ready",
  },
  {
    image: "/3 (1).png",
    title: "Click Mint Nft after investing for tracking animals in real time!",
    description:
      "In order to see your animals in real-time you have to have your Minted Nft as it is your token access.",
  },
];

export default function Walkthrough({ onFinish }: WalkthroughProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  // Al presionar "Prev" en el primer slide, se envuelve al último
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
    <div className="walkthrough-overlay">
      <div className="walkthrough-header">
        <h1>Welcome to Pastora Web3 Smart Contracts</h1>
      </div>
      <button onClick={handleSkip} className="walkthrough-skip">
        Skip
      </button>
      <div className="walkthrough-container">
        <div className="walkthrough-image">
          <img
            src={slides[currentSlide].image}
            alt={`Slide ${currentSlide + 1}`}
          />
        </div>
        <div className="walkthrough-content">
          <h2>{slides[currentSlide].title}</h2>
          <p>{slides[currentSlide].description}</p>
          <div className="walkthrough-buttons">
            <button onClick={handlePrev} className="btn-prev">
              Prev
            </button>
            <button onClick={handleNext} className="btn-next">
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
