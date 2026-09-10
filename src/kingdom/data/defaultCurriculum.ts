import { SubjectCurriculum } from '../types/learning';
import manifestData from './curriculumManifest.json';

const SCIENCE_CURRICULUM: SubjectCurriculum = {
  id: 'physics_math',
  subjectName: 'Physics & Science Formulas',
  iconName: 'Atom',
  levels: [
    {
      id: 'fund_physics',
      title: 'Core Fundamentals & Constants',
      description: 'Physical mechanics, kinetics, thermodynamics, and universal laws',
      units: [
        {
          id: 'classical_mechanics',
          title: 'Unit 1: Mechanics & Energy Laws',
          description: 'Fundamental equations governing motion and forces',
          lessons: [
            {
              id: 'newton_laws',
              title: 'Lesson 1: Newton\'s Laws of Motion',
              description: 'Classical principles of dynamics and mass acceleration',
              items: [
                {
                  id: 'phys_1_1',
                  primaryText: 'F = m · a',
                  secondaryText: 'Force = Mass × Acceleration (Newton\'s Second Law)',
                  contextOrNotes: 'Units: Force in Newtons (N), Mass in kg, Acceleration in m/s²',
                  categoryTag: 'Formula',
                },
                {
                  id: 'phys_1_2',
                  primaryText: 'E_k = ½ m v²',
                  secondaryText: 'Kinetic Energy = ½ × Mass × Velocity²',
                  contextOrNotes: 'Energy of a body in motion. Measured in Joules (J)',
                  categoryTag: 'Formula',
                },
                {
                  id: 'phys_1_3',
                  primaryText: 'W = F · d · cos(θ)',
                  secondaryText: 'Mechanical Work = Force × Displacement × cos(angle)',
                  contextOrNotes: 'Work done when force causes displacement',
                  categoryTag: 'Formula',
                },
                {
                  id: 'phys_1_4',
                  primaryText: 'E = m c²',
                  secondaryText: 'Mass-Energy Equivalence (Einstein)',
                  contextOrNotes: 'c is the speed of light in vacuum (~3×10⁸ m/s)',
                  categoryTag: 'Principle',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Combine all 7 generated language curriculums (A1 -> C2, 30 days each) + Science formulas
export const INITIAL_CURRICULUMS: SubjectCurriculum[] = [
  ...(manifestData.subjects as unknown as SubjectCurriculum[]),
  SCIENCE_CURRICULUM,
];
