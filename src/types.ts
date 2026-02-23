export interface Question {
  id: number;
  text: string;
  trait: 'E' | 'A' | 'C' | 'N' | 'O';
  isPositive: boolean;
}

export interface Scores {
  E: number;
  A: number;
  C: number;
  N: number;
  O: number;
}

export interface AnalysisResult {
  nickname: string;
  traits: string;
  jobs: string;
  partner: string;
}
