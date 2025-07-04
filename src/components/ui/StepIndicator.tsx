import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '@/lib/types';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  className?: string;
}

const steps = [
  { id: 'request', label: 'Talep Girişi', description: 'Müşteri talebi ve proje seçimi' },
  { id: 'processing', label: 'AI Analizi', description: 'Otomatik talep analizi' },
  { id: 'validation', label: 'Doğrulama', description: 'Sonuç kontrolü ve onay' }
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, className = '' }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                  )}
                </div>
                
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 max-w-[120px]">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center">
                  <ArrowRight className={`w-5 h-5 ${
                    index < currentStepIndex ? 'text-green-500' : 'text-gray-300'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;