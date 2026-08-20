import { create } from 'zustand'

interface ResumeStore {
  step: number
  resumeId: string | null
  jobDescription: string
  resumeName: string
  companyName: string
  targetRole: string
  template: string
  analysis: any | null
  resumeContent: any | null
  qualityCheck: any | null
  latexSource: string | null
  setStep: (step: number) => void
  setResumeId: (id: string) => void
  setJobDescription: (jd: string) => void
  setResumeName: (name: string) => void
  setCompanyName: (name: string) => void
  setTargetRole: (role: string) => void
  setTemplate: (t: string) => void
  setAnalysis: (a: any) => void
  setResumeContent: (c: any) => void
  setQualityCheck: (q: any) => void
  setLatexSource: (l: string) => void
  reset: () => void
}

export const useResumeStore = create<ResumeStore>((set) => ({
  step: 1,
  resumeId: null,
  jobDescription: '',
  resumeName: '',
  companyName: '',
  targetRole: '',
  template: 'classic-professional',
  analysis: null,
  resumeContent: null,
  qualityCheck: null,
  latexSource: null,
  setStep: (step) => set({ step }),
  setResumeId: (resumeId) => set({ resumeId }),
  setJobDescription: (jobDescription) => set({ jobDescription }),
  setResumeName: (resumeName) => set({ resumeName }),
  setCompanyName: (companyName) => set({ companyName }),
  setTargetRole: (targetRole) => set({ targetRole }),
  setTemplate: (template) => set({ template }),
  setAnalysis: (analysis) => set({ analysis }),
  setResumeContent: (resumeContent) => set({ resumeContent }),
  setQualityCheck: (qualityCheck) => set({ qualityCheck }),
  setLatexSource: (latexSource) => set({ latexSource }),
  reset: () =>
    set({
      step: 1,
      resumeId: null,
      jobDescription: '',
      resumeName: '',
      companyName: '',
      targetRole: '',
      template: 'classic-professional',
      analysis: null,
      resumeContent: null,
      qualityCheck: null,
      latexSource: null,
    }),
}))
