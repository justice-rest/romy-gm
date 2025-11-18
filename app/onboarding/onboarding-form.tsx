"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { TextMorph } from "@/components/motion-primitives/text-morph"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CaretLeft, Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { OnboardingFormData } from "@/app/api/onboarding/route"

const TOTAL_QUESTIONS = 9

const NONPROFIT_SECTORS = [
  "Education",
  "Animal Welfare",
  "Poverty Alleviation",
  "Healthcare",
  "Environment",
  "Arts & Culture",
  "Human Rights",
  "Disaster Relief",
  "Religious",
  "Other",
]

const BUDGET_RANGES = [
  "Under $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "Over $10M",
]

const DONOR_COUNT_RANGES = [
  "Under 100",
  "100 - 500",
  "500 - 1,000",
  "1,000 - 5,000",
  "5,000 - 10,000",
  "Over 10,000",
]

const WEALTH_SCREENING_TOOLS = [
  "WealthEngine",
  "iWave",
  "DonorSearch",
  "Blackbaud",
  "ResearchPoint",
  "Other",
  "None",
]

interface OnboardingFormProps {
  onComplete: (data: OnboardingFormData) => Promise<void>
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<OnboardingFormData>({
    first_name: null,
    nonprofit_name: null,
    nonprofit_location: null,
    nonprofit_sector: null,
    annual_budget: null,
    donor_count: null,
    fundraising_primary: null,
    prior_tools: null,
    purpose: null,
  })

  const progress = (currentStep / TOTAL_QUESTIONS) * 100

  const updateField = <K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const goNext = () => {
    if (currentStep < TOTAL_QUESTIONS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(formData)
    } catch (error) {
      console.error("Error submitting onboarding:", error)
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name && formData.first_name.trim().length > 0
      case 2:
        return (
          formData.nonprofit_name && formData.nonprofit_name.trim().length > 0
        )
      case 3:
        return (
          formData.nonprofit_location &&
          formData.nonprofit_location.trim().length > 0
        )
      case 4:
        return formData.nonprofit_sector !== null
      case 5:
        return formData.annual_budget !== null
      case 6:
        return formData.donor_count !== null
      case 7:
        return formData.fundraising_primary !== null
      case 8:
        return formData.prior_tools !== null && formData.prior_tools.length > 0
      case 9:
        return formData.purpose && formData.purpose.trim().length > 0
      default:
        return false
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed()) {
      e.preventDefault()
      if (currentStep === TOTAL_QUESTIONS) {
        handleSubmit()
      } else {
        goNext()
      }
    }
  }

  const toggleTool = (tool: string) => {
    const currentTools = formData.prior_tools || []
    const hasNone = currentTools.includes("None")
    const isTogglingNone = tool === "None"

    if (isTogglingNone) {
      updateField("prior_tools", ["None"])
    } else {
      const newTools = currentTools.includes(tool)
        ? currentTools.filter((t) => t !== tool)
        : [...currentTools.filter((t) => t !== "None"), tool]
      updateField("prior_tools", newTools.length > 0 ? newTools : null)
    }
  }

  return (
    <div className="bg-background relative flex h-dvh w-full flex-col">
      {/* Progress Bar */}
      <div className="bg-muted fixed left-0 right-0 top-0 z-50 h-1">
        <motion.div
          className="bg-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Back Button */}
      {currentStep > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={goBack}
          className="text-muted-foreground hover:text-foreground fixed left-4 top-4 z-50 flex items-center gap-2 transition-colors sm:left-8 sm:top-8"
        >
          <CaretLeft className="size-5" weight="bold" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      {/* Step Counter */}
      <div className="text-muted-foreground fixed right-4 top-4 z-50 text-sm font-medium sm:right-8 sm:top-8">
        {currentStep} / {TOTAL_QUESTIONS}
      </div>

      {/* Question Container */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-16">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Question 1: First Name */}
            {currentStep === 1 && (
              <motion.div
                key="q1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-foreground mb-3 block text-2xl font-medium sm:text-3xl">
                    What's your first name?
                  </Label>
                  <Input
                    placeholder="Type your answer here..."
                    value={formData.first_name || ""}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoFocus
                    className="text-foreground border-border h-14 border-b-2 border-l-0 border-r-0 border-t-0 bg-transparent px-0 text-xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="h-12 px-8 text-base"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Question 2: Nonprofit Name */}
            {currentStep === 2 && (
              <motion.div
                key="q2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-foreground mb-3 block text-2xl font-medium sm:text-3xl">
                    What nonprofit do you work for/with?
                  </Label>
                  <Input
                    placeholder="Organization name..."
                    value={formData.nonprofit_name || ""}
                    onChange={(e) =>
                      updateField("nonprofit_name", e.target.value)
                    }
                    onKeyDown={handleKeyPress}
                    autoFocus
                    className="text-foreground border-border h-14 border-b-2 border-l-0 border-r-0 border-t-0 bg-transparent px-0 text-xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="h-12 px-8 text-base"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Question 3: Location */}
            {currentStep === 3 && (
              <motion.div
                key="q3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-foreground mb-3 block text-2xl font-medium sm:text-3xl">
                    Where is it based?
                  </Label>
                  <p className="text-muted-foreground mb-4 text-sm">
                    City/State or Country
                  </p>
                  <Input
                    placeholder="e.g., New York, NY or United Kingdom"
                    value={formData.nonprofit_location || ""}
                    onChange={(e) =>
                      updateField("nonprofit_location", e.target.value)
                    }
                    onKeyDown={handleKeyPress}
                    autoFocus
                    className="text-foreground border-border h-14 border-b-2 border-l-0 border-r-0 border-t-0 bg-transparent px-0 text-xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="h-12 px-8 text-base"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Question 4: Sector */}
            {currentStep === 4 && (
              <motion.div
                key="q4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Label className="text-foreground mb-6 block text-2xl font-medium sm:text-3xl">
                  What sector is it in?
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {NONPROFIT_SECTORS.map((sector) => (
                    <button
                      key={sector}
                      onClick={() => {
                        updateField("nonprofit_sector", sector)
                        setTimeout(goNext, 200)
                      }}
                      className={cn(
                        "border-border hover:border-primary hover:bg-accent text-foreground flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                        formData.nonprofit_sector === sector &&
                          "border-primary bg-accent",
                      )}
                    >
                      <span className="font-medium">{sector}</span>
                      {formData.nonprofit_sector === sector && (
                        <Check className="text-primary size-5" weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Question 5: Annual Budget */}
            {currentStep === 5 && (
              <motion.div
                key="q5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Label className="text-foreground mb-6 block text-2xl font-medium sm:text-3xl">
                  Approximately what is the size of your annual budget?
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BUDGET_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        updateField("annual_budget", range)
                        setTimeout(goNext, 200)
                      }}
                      className={cn(
                        "border-border hover:border-primary hover:bg-accent text-foreground flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                        formData.annual_budget === range &&
                          "border-primary bg-accent",
                      )}
                    >
                      <span className="font-medium">{range}</span>
                      {formData.annual_budget === range && (
                        <Check className="text-primary size-5" weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Question 6: Donor Count */}
            {currentStep === 6 && (
              <motion.div
                key="q6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Label className="text-foreground mb-6 block text-2xl font-medium sm:text-3xl">
                  Approximately how many individual donors are in your database?
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {DONOR_COUNT_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        updateField("donor_count", range)
                        setTimeout(goNext, 200)
                      }}
                      className={cn(
                        "border-border hover:border-primary hover:bg-accent text-foreground flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                        formData.donor_count === range &&
                          "border-primary bg-accent",
                      )}
                    >
                      <span className="font-medium">{range}</span>
                      {formData.donor_count === range && (
                        <Check className="text-primary size-5" weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Question 7: Fundraising Primary */}
            {currentStep === 7 && (
              <motion.div
                key="q7"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-foreground mb-3 block text-2xl font-medium sm:text-3xl">
                    Is fundraising your primary responsibility?
                  </Label>
                  <p className="text-muted-foreground mb-6 text-sm">
                    If you are a solo staff member, please answer 'Yes'
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      updateField("fundraising_primary", true)
                      setTimeout(goNext, 200)
                    }}
                    className={cn(
                      "border-border hover:border-primary hover:bg-accent text-foreground flex flex-1 items-center justify-between rounded-lg border-2 p-6 text-left transition-all",
                      formData.fundraising_primary === true &&
                        "border-primary bg-accent",
                    )}
                  >
                    <span className="text-lg font-medium">Yes</span>
                    {formData.fundraising_primary === true && (
                      <Check className="text-primary size-6" weight="bold" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      updateField("fundraising_primary", false)
                      setTimeout(goNext, 200)
                    }}
                    className={cn(
                      "border-border hover:border-primary hover:bg-accent text-foreground flex flex-1 items-center justify-between rounded-lg border-2 p-6 text-left transition-all",
                      formData.fundraising_primary === false &&
                        "border-primary bg-accent",
                    )}
                  >
                    <span className="text-lg font-medium">No</span>
                    {formData.fundraising_primary === false && (
                      <Check className="text-primary size-6" weight="bold" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Question 8: Prior Tools */}
            {currentStep === 8 && (
              <motion.div
                key="q8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Label className="text-foreground mb-6 block text-2xl font-medium sm:text-3xl">
                  Have you ever worked with donor wealth screening tools before?
                </Label>
                <div className="space-y-3">
                  {WEALTH_SCREENING_TOOLS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={cn(
                        "border-border hover:border-primary hover:bg-accent text-foreground flex w-full items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                        formData.prior_tools?.includes(tool) &&
                          "border-primary bg-accent",
                      )}
                    >
                      <span className="font-medium">{tool}</span>
                      {formData.prior_tools?.includes(tool) && (
                        <Check className="text-primary size-5" weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="mt-4 h-12 px-8 text-base"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Question 9: Purpose */}
            {currentStep === 9 && (
              <motion.div
                key="q9"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-foreground mb-3 block text-2xl font-medium sm:text-3xl">
                    We aim to be different! ...&apos;Effective, affordable and
                    FUN!&apos;
                  </Label>
                  <Label className="text-foreground mb-4 block text-2xl font-medium sm:text-3xl">
                    What&apos;s your purpose in trying Rōmy?
                  </Label>
                  <Textarea
                    placeholder="Tell us what you hope to achieve..."
                    value={formData.purpose || ""}
                    onChange={(e) => updateField("purpose", e.target.value)}
                    autoFocus
                    rows={5}
                    className="text-foreground border-border resize-none border-2 text-lg placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="h-12 px-8 text-base"
                >
                  {isSubmitting ? "Submitting..." : "Complete"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hint Text */}
      <div className="text-muted-foreground fixed bottom-6 left-0 right-0 text-center text-sm">
        Press <kbd className="bg-muted rounded px-1.5 py-0.5">Enter ↵</kbd> to
        continue
      </div>
    </div>
  )
}
