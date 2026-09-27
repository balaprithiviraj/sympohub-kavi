require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Event = require('../models/Event');
const Student = require('../models/Student');

const IMAGES = {
  Symposium: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
  Workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop',
  Hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
  'Paper Presentation': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
  'Project Expo': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop',
  Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop'
};

const deadlineNote = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 3);
  return `Registration closes on ${d.toDateString()}.`;
};

const events = [
  {
    title: 'TechNova National Symposium 2026',
    category: 'Symposium',
    description: `A flagship two-day national symposium featuring keynote talks, panel discussions and technical contests across CSE, ECE and Mechanical. Over 40 colleges participate with prize pool worth Rs. 2 lakhs. ${deadlineNote('2026-10-15')}`,
    college: 'Anna University',
    organizer: 'TechNova Organizing Committee, Anna University',
    date: new Date('2026-10-15T09:00:00'),
    time: '9:00 AM - 5:00 PM',
    venue: 'Main Auditorium, Anna University, Chennai',
    rules: [
      'College ID card is mandatory for entry.',
      'Teams of 1-3 members allowed for technical contests.',
      'Plagiarism in paper submissions leads to disqualification.',
      'On-spot registrations close 30 minutes before each event.',
      'Judges decision will be final and binding.'
    ],
    participantLimit: 500,
    registeredCount: 0,
    image: IMAGES.Symposium,
    featured: true
  },
  {
    title: 'ElectroVision Tech Symposium',
    category: 'Symposium',
    description: `A core-engineering symposium focused on VLSI, embedded systems, robotics and power systems with live demos and circuit debugging contests. Ideal for ECE and EEE students to showcase practical skills. ${deadlineNote('2026-11-05')}`,
    college: 'PSG College of Technology',
    organizer: 'EEE & ECE Association, PSG Tech',
    date: new Date('2026-11-05T09:30:00'),
    time: '9:30 AM - 4:30 PM',
    venue: 'Assembly Hall, PSG College of Technology, Coimbatore',
    rules: [
      'Participants must bring their own laptops and toolkits.',
      'Maximum 2 members per team for hardware contests.',
      'Damaged components must be reported immediately.',
      'Late entries will not be entertained.'
    ],
    participantLimit: 300,
    registeredCount: 0,
    image: IMAGES.Symposium,
    featured: false
  },
  {
    title: 'Full-Stack Web Development Bootcamp',
    category: 'Workshop',
    description: `A 2-day intensive hands-on bootcamp covering React, Node.js, Express and MongoDB where you build and deploy a complete MERN app. Mentored by industry developers with certification on completion. ${deadlineNote('2026-10-22')}`,
    college: 'SSN College of Engineering',
    organizer: 'Coding Club, SSN College of Engineering',
    date: new Date('2026-10-22T10:00:00'),
    time: '10:00 AM - 4:00 PM',
    venue: 'CSE Seminar Hall, SSN College of Engineering',
    rules: [
      'Bring a fully charged laptop with Node.js pre-installed.',
      'Basic JavaScript knowledge is expected.',
      'Attendance on both days is required for certification.',
      'Sharing of workshop materials outside is prohibited.',
      'Seats are confirmed on first-come first-served basis.'
    ],
    participantLimit: 120,
    registeredCount: 0,
    image: IMAGES.Workshop,
    featured: true
  },
  {
    title: 'AI & Machine Learning Hands-on Workshop',
    category: 'Workshop',
    description: `Learn Python, scikit-learn, TensorFlow basics and build image classification and chatbot mini-projects in one day. Includes datasets, Colab notebooks and career guidance for AI roles. ${deadlineNote('2026-11-12')}`,
    college: 'VIT Chennai',
    organizer: 'AI Research Lab, VIT Chennai',
    date: new Date('2026-11-12T09:00:00'),
    time: '9:00 AM - 5:00 PM',
    venue: 'Innovation Centre, VIT Chennai',
    rules: [
      'Google account required for Colab access.',
      'Individual participation only.',
      'Python basics recommended but not mandatory.',
      'Certificates issued only after project submission.'
    ],
    participantLimit: 100,
    registeredCount: 0,
    image: IMAGES.Workshop,
    featured: false
  },
  {
    title: 'HackNight 36-Hour Hackathon',
    category: 'Hackathon',
    description: `Tamil Nadu's biggest overnight hackathon where 50 teams build prototypes around AI for Good, FinTech and Sustainability. Top 3 teams win cash prizes plus incubation support. ${deadlineNote('2026-12-04')}`,
    college: 'SRM Institute',
    organizer: 'Hack Club SRM & DSC SRM',
    date: new Date('2026-12-04T18:00:00'),
    time: '6:00 PM onwards (36 hours)',
    venue: 'Tech Park, SRM Institute of Science and Technology',
    rules: [
      'Teams of 2-4 members; cross-college teams allowed.',
      'Code must be written during the hackathon; pre-built templates allowed with disclosure.',
      'Use of open-source libraries is encouraged.',
      'Final demo is 5 minutes plus 2 minutes Q&A.',
      'Organizers decision on prizes is final.'
    ],
    participantLimit: 200,
    registeredCount: 0,
    image: IMAGES.Hackathon,
    featured: true
  },
  {
    title: 'CodeSprint Inter-College Hackathon',
    category: 'Hackathon',
    description: `A 24-hour sprint focused on web3, cybersecurity and open innovation challenges posed by startup partners. Mentors available round the clock with free food and swag. ${deadlineNote('2027-01-09')}`,
    college: 'NIT Trichy',
    organizer: 'Delta Force & Spider Club, NIT Trichy',
    date: new Date('2027-01-09T09:00:00'),
    time: '9:00 AM onwards (24 hours)',
    venue: 'Octagon Computer Centre, NIT Trichy',
    rules: [
      'Teams of 1-4 members.',
      'Bring your own hardware; WiFi and power provided.',
      'External APIs allowed; GitHub repo must be public.',
      'Any form of cheating leads to immediate disqualification.'
    ],
    participantLimit: 150,
    registeredCount: 0,
    image: IMAGES.Hackathon,
    featured: false
  },
  {
    title: 'InnovatePaper National Conference',
    category: 'Paper Presentation',
    description: `Present your research papers across CSE, IT, AI and interdisciplinary topics before a panel of professors and industry experts. Selected papers will be published in conference proceedings with ISBN. ${deadlineNote('2026-10-28')}`,
    college: 'Anna University',
    organizer: 'Research & Development Cell, Anna University',
    date: new Date('2026-10-28T10:00:00'),
    time: '10:00 AM - 4:00 PM',
    venue: 'Conference Hall, Anna University, Chennai',
    rules: [
      'Abstract of max 250 words must be submitted before deadline.',
      'Maximum 2 authors per paper, at least one must present.',
      'Presentation time is 8 minutes plus 2 minutes Q&A.',
      'IEEE format mandatory for full paper.',
      'Plagiarism above 15% will be rejected.'
    ],
    participantLimit: 80,
    registeredCount: 0,
    image: IMAGES['Paper Presentation'],
    featured: false
  },
  {
    title: 'Research Frontiers Paper Meet',
    category: 'Paper Presentation',
    description: `A premium forum for UG and PG scholars to present ideas on renewable energy, smart materials and IoT systems. Best paper awards in each track with internship referrals. ${deadlineNote('2027-02-11')}`,
    college: 'PSG College of Technology',
    organizer: 'Research Council, PSG Tech',
    date: new Date('2027-02-11T09:30:00'),
    time: '9:30 AM - 5:00 PM',
    venue: 'GRD Auditorium, PSG College of Technology',
    rules: [
      'Papers must be original and unpublished.',
      'Teams of up to 3 members.',
      'Bring 2 hard copies and PPT on pen drive.',
      'Q&A attendance is mandatory for evaluation.'
    ],
    participantLimit: 90,
    registeredCount: 0,
    image: IMAGES['Paper Presentation'],
    featured: false
  },
  {
    title: 'BuildExpo Project Showcase',
    category: 'Project Expo',
    description: `Demonstrate your hardware and software projects — from IoT devices to SaaS apps — to judges, investors and 2000+ visitors. Live stalls, demo videos and crowd-favourite voting included. ${deadlineNote('2026-11-20')}`,
    college: 'VIT Chennai',
    organizer: 'Innovation & Entrepreneurship Cell, VIT Chennai',
    date: new Date('2026-11-20T09:00:00'),
    time: '9:00 AM - 6:00 PM',
    venue: 'Exhibition Ground, VIT Chennai',
    rules: [
      'Teams of 1-4 members per project.',
      'Working prototype or MVP is mandatory.',
      'Teams must arrange own components; power and tables provided.',
      'Poster of size A1 must be displayed at stall.',
      'Judging criteria: innovation, impact, execution and presentation.'
    ],
    participantLimit: 250,
    registeredCount: 0,
    image: IMAGES['Project Expo'],
    featured: true
  },
  {
    title: 'MakerFest Engineering Expo',
    category: 'Project Expo',
    description: `A celebration of makers with 3D printing, robotics, drones and sustainable design projects on display. Workshops on patent filing and product pitching run alongside the expo. ${deadlineNote('2027-01-21')}`,
    college: 'SSN College of Engineering',
    organizer: 'Entrepreneurship Development Cell, SSN',
    date: new Date('2027-01-21T10:00:00'),
    time: '10:00 AM - 5:00 PM',
    venue: 'Indoor Stadium, SSN College of Engineering',
    rules: [
      'One project per team.',
      'Hazardous materials strictly prohibited.',
      'Demo video under 2 minutes must be submitted in advance.',
      'Stall setup must be complete 1 hour before inauguration.'
    ],
    participantLimit: 180,
    registeredCount: 0,
    image: IMAGES['Project Expo'],
    featured: false
  },
  {
    title: 'RhythmFest Cultural Carnival',
    category: 'Cultural',
    description: `Three days of music, dance, drama, fashion show and battle of bands with celebrity guest nights. Flagship culturals of Chennai with 5000+ footfall and star performances. ${deadlineNote('2026-12-18')}`,
    college: 'Loyola College',
    organizer: 'Students Union, Loyola College',
    date: new Date('2026-12-18T11:00:00'),
    time: '11:00 AM - 9:00 PM',
    venue: 'Open Air Theatre, Loyola College, Chennai',
    rules: [
      'College ID mandatory; outsiders need event pass.',
      'Vulgarity or offensive content leads to disqualification.',
      'Time limit: 6+2 minutes for group dance, 4+1 for solo.',
      'Sound tracks must be submitted 2 days prior in MP3.',
      'Management is not responsible for lost belongings.'
    ],
    participantLimit: 800,
    registeredCount: 0,
    image: IMAGES.Cultural,
    featured: true
  },
  {
    title: 'ArtBeat Inter-College Culturals',
    category: 'Cultural',
    description: `Compete in 20+ events from classical dance to stand-up comedy, photography to short film contests. Pro shows every evening plus food stalls and flea market. ${deadlineNote('2027-02-26')}`,
    college: 'SRM Institute',
    organizer: 'Cultural Committee, SRM Institute',
    date: new Date('2027-02-26T10:00:00'),
    time: '10:00 AM - 8:00 PM',
    venue: 'Main Campus Ground, SRM Institute, Kattankulathur',
    rules: [
      'On-spot registrations allowed only for non-stage events.',
      'One participant can take part in max 3 events.',
      'Props must be arranged by participants.',
      'Judges decision is final.'
    ],
    participantLimit: 600,
    registeredCount: 0,
    image: IMAGES.Cultural,
    featured: false
  },
  {
    title: 'Champions Trophy Sports Meet',
    category: 'Sports',
    description: `Annual inter-college athletics, cricket, basketball, badminton and kabaddi tournament spanning 3 days. Professional referees, physio support and trophies for overall championship. ${deadlineNote('2027-03-05')}`,
    college: 'NIT Trichy',
    organizer: 'Sports Council, NIT Trichy',
    date: new Date('2027-03-05T07:00:00'),
    time: '7:00 AM - 6:00 PM',
    venue: 'Sports Complex, NIT Trichy',
    rules: [
      'Bonafide certificate and college ID mandatory.',
      'Teams must report 30 minutes before match time.',
      'Walkover given if team is 15 minutes late.',
      'Referee decision is final; misconduct leads to ban.',
      'Participants must bring own sports gear except balls.'
    ],
    participantLimit: 400,
    registeredCount: 0,
    image: IMAGES.Sports,
    featured: false
  },
  {
    title: 'Premier League Football Tournament',
    category: 'Sports',
    description: `A 7-a-side knockout football tournament under floodlights with live commentary and 32 college teams battling for the SympoHub Cup. Best player and golden boot awards included. ${deadlineNote('2027-03-12')}`,
    college: 'Loyola College',
    organizer: 'Department of Physical Education, Loyola College',
    date: new Date('2027-03-12T15:00:00'),
    time: '3:00 PM - 9:00 PM',
    venue: 'Football Ground, Loyola College, Chennai',
    rules: [
      'Squad of 10 players max, 7 on field.',
      'Matches of 20 minutes (10+10) with rolling substitutes.',
      'Red card leads to one-match suspension.',
      'Teams must wear matching jerseys with numbers.'
    ],
    participantLimit: 320,
    registeredCount: 0,
    image: IMAGES.Sports,
    featured: false
  }
];

const seed = async (opts = {}) => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sympohub';
  let mongod = null;
  try {
    if (uri === 'memory') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using in-memory MongoDB for seeding (data will not persist after restart)');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected for seeding');

    await Event.deleteMany({});
    console.log('Cleared Events collection');

    const inserted = await Event.insertMany(events);
    console.log(`Inserted ${inserted.length} events`);

    const sampleEmail = 'priya.sharma@college.edu';
    let sample = await Student.findOne({ email: sampleEmail });
    if (!sample) {
      const passwordHash = await bcrypt.hash('Priya@123', 10);
      sample = await Student.create({
        name: 'Priya Sharma',
        email: sampleEmail,
        phone: '9876543210',
        college: 'Anna University',
        department: 'Computer Science',
        passwordHash
      });
      console.log('Created sample student priya.sharma@college.edu / Priya@123');
    } else {
      console.log('Sample student already exists');
    }

    console.log('Seeding complete');
    if (opts.keepAlive) return { inserted: inserted.length };
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    if (opts.keepAlive) throw err;
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed, events };
