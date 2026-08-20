import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping seed in production')
    return
  }

  const passwordHash = await bcrypt.hash('Demo1234!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@resumeforge.local' },
    update: {},
    create: {
      name: 'Alex Chen',
      email: 'demo@resumeforge.local',
      passwordHash,
      profile: {
        create: {
          professionalHeadline: 'Senior Full-Stack Engineer',
          email: 'alex.chen@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          linkedinUrl: 'https://linkedin.com/in/alexchen',
          githubUrl: 'https://github.com/alexchen',
          portfolioUrl: 'https://alexchen.dev',
          professionalSummary:
            'Experienced full-stack engineer with 8+ years building scalable web applications. Led teams of 5-12 engineers, delivering products serving 1M+ users. Deep expertise in React, Node.js, TypeScript, and cloud infrastructure.',
        },
      },
      experiences: {
        create: [
          {
            company: 'TechCorp Inc.',
            title: 'Senior Full-Stack Engineer',
            location: 'San Francisco, CA',
            startDate: new Date('2021-03-01'),
            isCurrent: true,
            originalDescription:
              'Lead development of customer-facing dashboard serving 500K daily active users. Architected microservices migration reducing infrastructure costs by 40%. Mentored 5 junior engineers.',
            achievements: [
              'Led dashboard rebuild serving 500K DAU',
              'Architected microservices migration saving 40% on infrastructure',
              'Mentored 5 junior engineers',
              'Implemented CI/CD pipeline reducing deploy time by 60%',
            ],
            sortOrder: 0,
          },
          {
            company: 'StartupXYZ',
            title: 'Full-Stack Developer',
            location: 'Remote',
            startDate: new Date('2019-01-01'),
            endDate: new Date('2021-02-28'),
            isCurrent: false,
            originalDescription:
              'Built real-time collaboration features using WebSockets. Developed payment integration with Stripe. Reduced page load time by 50% through code splitting and lazy loading.',
            achievements: [
              'Built real-time collaboration features with WebSockets',
              'Integrated Stripe payment processing',
              'Reduced page load time by 50%',
              'Implemented A/B testing framework',
            ],
            sortOrder: 1,
          },
          {
            company: 'WebAgency Co.',
            title: 'Junior Developer',
            location: 'New York, NY',
            startDate: new Date('2017-06-01'),
            endDate: new Date('2018-12-31'),
            isCurrent: false,
            originalDescription:
              'Developed responsive websites for 20+ clients. Built custom WordPress themes. Implemented SEO improvements increasing organic traffic by 35%.',
            achievements: [
              'Delivered 20+ client websites',
              'Built custom WordPress themes',
              'Increased organic traffic by 35% through SEO',
            ],
            sortOrder: 2,
          },
        ],
      },
      education: {
        create: [
          {
            institution: 'University of California, Berkeley',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2013-08-01'),
            endDate: new Date('2017-05-15'),
            description: "Dean's List. Focus on distributed systems and machine learning.",
          },
        ],
      },
      skills: {
        create: [
          { name: 'TypeScript', category: 'Languages', level: 'Expert', sortOrder: 0 },
          { name: 'JavaScript', category: 'Languages', level: 'Expert', sortOrder: 1 },
          { name: 'Python', category: 'Languages', level: 'Advanced', sortOrder: 2 },
          { name: 'SQL', category: 'Languages', level: 'Advanced', sortOrder: 3 },
          { name: 'React', category: 'Frontend', level: 'Expert', sortOrder: 4 },
          { name: 'Next.js', category: 'Frontend', level: 'Expert', sortOrder: 5 },
          { name: 'Tailwind CSS', category: 'Frontend', level: 'Expert', sortOrder: 6 },
          { name: 'Node.js', category: 'Backend', level: 'Expert', sortOrder: 7 },
          { name: 'Express.js', category: 'Backend', level: 'Advanced', sortOrder: 8 },
          { name: 'PostgreSQL', category: 'Database', level: 'Advanced', sortOrder: 9 },
          { name: 'Redis', category: 'Database', level: 'Advanced', sortOrder: 10 },
          { name: 'MongoDB', category: 'Database', level: 'Intermediate', sortOrder: 11 },
          { name: 'AWS', category: 'Cloud', level: 'Advanced', sortOrder: 12 },
          { name: 'Docker', category: 'DevOps', level: 'Advanced', sortOrder: 13 },
          { name: 'Kubernetes', category: 'DevOps', level: 'Intermediate', sortOrder: 14 },
          { name: 'Git', category: 'Tools', level: 'Expert', sortOrder: 15 },
          { name: 'CI/CD', category: 'DevOps', level: 'Advanced', sortOrder: 16 },
          { name: 'GraphQL', category: 'API', level: 'Advanced', sortOrder: 17 },
          { name: 'REST APIs', category: 'API', level: 'Expert', sortOrder: 18 },
          { name: 'Figma', category: 'Design', level: 'Intermediate', sortOrder: 19 },
        ],
      },
      projects: {
        create: [
          {
            name: 'OpenAnalytics Dashboard',
            description:
              'Open-source analytics dashboard built with React and D3.js. 2.5K GitHub stars. Features real-time data visualization, custom report builder, and team collaboration.',
            url: 'https://github.com/alexchen/openanalytics',
            technologies: ['React', 'D3.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
            startDate: new Date('2022-06-01'),
          },
          {
            name: 'DeployBot',
            description:
              'CLI tool for automated deployment pipelines. Integrates with GitHub Actions, AWS, and Docker. 800+ weekly npm downloads.',
            url: 'https://github.com/alexchen/deploybot',
            technologies: ['TypeScript', 'Node.js', 'Docker', 'AWS SDK'],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-08-15'),
          },
        ],
      },
      certifications: {
        create: [
          {
            name: 'AWS Solutions Architect – Associate',
            issuer: 'Amazon Web Services',
            issueDate: new Date('2022-04-15'),
            credentialUrl: 'https://aws.amazon.com/verification/abc123',
          },
          {
            name: 'Google Cloud Professional Cloud Developer',
            issuer: 'Google Cloud',
            issueDate: new Date('2023-07-20'),
          },
        ],
      },
      languages: {
        create: [
          { name: 'English', proficiency: 'Native', sortOrder: 0 },
          { name: 'Mandarin', proficiency: 'Professional', sortOrder: 1 },
          { name: 'Spanish', proficiency: 'Conversational', sortOrder: 2 },
        ],
      },
    },
    include: {
      profile: true,
      experiences: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true,
    },
  })

  console.log(`Seeded demo user: ${user.email}`)
  console.log(`Profile: ${user.profile?.professionalHeadline}`)
  console.log(`Experiences: ${user.experiences.length}`)
  console.log(`Skills: ${user.skills.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
