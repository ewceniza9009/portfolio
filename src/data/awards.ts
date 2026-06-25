export interface Award {
  id: string;
  title: string;
  date: string;
  company: string;
  description: string;
  image: string;
}

const awards: Award[] = [
  {
    id: 'award-of-excellence',
    title: 'Award of Excellence',
    date: 'DEC 2024',
    company: 'AccountMate Corporation',
    description: 'Earned for playing a key role in developing and stabilizing the company\'s core platform. This award highlighted my focus on delivering reliable, high-performance code and stepping up to solve critical technical challenges when the team needed it most.',
    image: '/img/awardofexcellence.png'
  },
  {
    id: 'service-award',
    title: 'Service Award',
    date: 'DEC 2023',
    company: 'AccountMate Corporation',
    description: 'Awarded in recognition of five years of continuous dedication and technical contribution to the company. Over half a decade, I helped evolve our systems from early iterations into mature, scalable products while mentoring newer developers along the way.',
    image: '/img/serviceaward.png'
  }
];

export default awards;
