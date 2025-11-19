import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAutoFitText } from "@/hooks/useAutoFitText";

interface MiniTourProps {
  onFinish: () => void;
}

const TOUR_STEPS = [
  {
    icon: "🎉",
    title: "Hoş geldin!",
    description: "Sosyal içerik artık zincirde bir değer oluşturuyor.",
  },
  {
    icon: "🔗",
    title: "Contribute → Yatırım → Trend",
    description: "Paylaşımın ne kadar iyiyse kazanç potansiyelin o kadar artar.",
  },
  {
    icon: "📈",
    title: "BUY/SELL pozisyonları tamamen on-chain.",
    description: "NFT Position Engine sayesinde sahiplik %100 senindir.",
  },
  {
    icon: "🧠",
    title: "Pool Analytics, AI Sentiment ve Alpha Score ile",
    description: "her gönderi bir yatırım varlığı gibi analiz edilir.",
  },
  {
    icon: "⭐",
    title: "Hazırsın.",
    description: "NOP Intelligence Layer'ın gücünü keşfet!",
  },
];

export function MiniTour({ onFinish }: MiniTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const step = TOUR_STEPS[currentStep];

  // Auto-fit text for final screen - using container height calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(200);
  const { textRef } = useAutoFitText(containerHeight, 0.75, 1.125);

  // Calculate container height for auto-fit
  useEffect(() => {
    if (isLastStep && containerRef.current) {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setContainerHeight(Math.max(60, rect.height - 100));
        }
      };
      updateHeight();
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, [isLastStep, currentStep]);

  // Prevent body scroll when tour is open
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nopMiniTour", "done");
    }
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Tour Card */}
      <Card
        ref={containerRef}
        className={`relative w-full max-w-[420px] max-h-[90vh] overflow-hidden border-border-subtle bg-[#F5F8FF] shadow-[0_22px_50px_rgba(0,0,0,0.15)] dark:bg-[#0B0F19] dark:shadow-[0_22px_50px_rgba(0,0,0,0.65)] ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } transition-all duration-200`}
      >
        <CardContent className="p-6">
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-6 text-5xl animate-in fade-in-0 zoom-in-95 duration-300">
              {step.icon}
            </div>

            {/* Title */}
            <h2 className="mb-4 text-2xl font-semibold leading-tight text-[#0F172A] dark:text-white">
              {step.title}
            </h2>

            {/* Description */}
            {isLastStep ? (
              <div
                ref={textRef}
                className="mb-8 min-h-[60px] max-h-[200px] overflow-hidden text-lg leading-relaxed text-[#0F172A] dark:text-white"
                style={{ fontSize: "1.125rem" }}
              >
                {step.description}
              </div>
            ) : (
              <p className="mb-8 text-lg leading-relaxed text-[#0F172A] dark:text-white">
                {step.description}
              </p>
            )}

            {/* Progress Dots */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-8 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] shadow-sm"
                      : "w-2 bg-border-subtle"
                  }`}
                  aria-label={`Step ${index + 1} of ${TOUR_STEPS.length}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-3">
              {!isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 border-border-subtle bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                >
                  Skip
                </Button>
              )}
              <Button
                variant="accent"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white shadow-soft hover:brightness-105 active:scale-[0.98] transition-transform"
              >
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

