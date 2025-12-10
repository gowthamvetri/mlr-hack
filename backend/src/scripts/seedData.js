const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
const Department = require('../models/Department');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Placement = require('../models/Placement');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDepartments = async () => {
  const departments = [
    {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering focusing on software development, AI, and computing systems.',
      establishedYear: 1998,
      totalStudents: 847,
      totalFaculty: 45,
    },
    {
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      description: 'Department focusing on electronics, communication systems, and embedded systems.',
      establishedYear: 1998,
      totalStudents: 523,
      totalFaculty: 38,
    },
    {
      name: 'Electrical & Electronics Engineering',
      code: 'EEE',
      description: 'Department of Electrical and Electronics Engineering.',
      establishedYear: 2000,
      totalStudents: 312,
      totalFaculty: 25,
    },
    {
      name: 'Mechanical Engineering',
      code: 'MECH',
      description: 'Department of Mechanical Engineering focusing on design, manufacturing, and thermal systems.',
      establishedYear: 1998,
      totalStudents: 425,
      totalFaculty: 32,
    },
    {
      name: 'Civil Engineering',
      code: 'CIVIL',
      description: 'Department of Civil Engineering focusing on structural and environmental engineering.',
      establishedYear: 2002,
      totalStudents: 180,
      totalFaculty: 18,
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Department of Information Technology focusing on software systems and networking.',
      establishedYear: 2001,
      totalStudents: 385,
      totalFaculty: 28,
    },
  ];

  await Department.deleteMany({});
  const createdDepts = await Department.insertMany(departments);
  console.log(`${createdDepts.length} departments created`);
  return createdDepts;
};

const seedCourses = async (departments) => {
  const cseDept = departments.find(d => d.code === 'CSE');
  const eceDept = departments.find(d => d.code === 'ECE');
  const mechDept = departments.find(d => d.code === 'MECH');
  const itDept = departments.find(d => d.code === 'IT');

  const courses = [
    {
      name: 'Data Structures & Algorithms',
      code: 'CS301',
      department: cseDept._id,
      credits: 4,
      semester: '3',
      status: 'Active',
      totalEnrolled: 156,
      rating: 4.8,
      description: 'Fundamental data structures and algorithmic problem solving.',
    },
    {
      name: 'Machine Learning',
      code: 'CS401',
      department: cseDept._id,
      credits: 4,
      semester: '7',
      status: 'Active',
      totalEnrolled: 128,
      rating: 4.7,
      description: 'Introduction to machine learning concepts and algorithms.',
    },
    {
      name: 'Database Management Systems',
      code: 'CS302',
      department: cseDept._id,
      credits: 3,
      semester: '5',
      status: 'Active',
      totalEnrolled: 142,
      rating: 4.6,
      description: 'Relational databases, SQL, and database design.',
    },
    {
      name: 'Digital Electronics',
      code: 'EC201',
      department: eceDept._id,
      credits: 3,
      semester: '3',
      status: 'Active',
      totalEnrolled: 98,
      rating: 4.5,
      description: 'Digital circuits and logic design.',
    },
    {
      name: 'Computer Networks',
      code: 'CS303',
      department: cseDept._id,
      credits: 3,
      semester: '5',
      status: 'Active',
      totalEnrolled: 134,
      rating: 4.4,
      description: 'Network protocols, architecture, and security.',
    },
    {
      name: 'Thermodynamics',
      code: 'ME201',
      department: mechDept._id,
      credits: 4,
      semester: '3',
      status: 'Active',
      totalEnrolled: 87,
      rating: 4.3,
      description: 'Laws of thermodynamics and their applications.',
    },
    {
      name: 'Web Development',
      code: 'IT302',
      department: itDept._id,
      credits: 3,
      semester: '5',
      status: 'Active',
      totalEnrolled: 112,
      rating: 4.6,
      description: 'Full-stack web development with modern frameworks.',
    },
    {
      name: 'Artificial Intelligence',
      code: 'CS402',
      department: cseDept._id,
      credits: 4,
      semester: '7',
      status: 'Active',
      totalEnrolled: 95,
      rating: 4.5,
      description: 'AI concepts, search algorithms, and knowledge representation.',
    },
  ];

  await Course.deleteMany({});
  const createdCourses = await Course.insertMany(courses);
  console.log(`${createdCourses.length} courses created`);
  return createdCourses;
};

const seedPlacements = async () => {
  const placements = [
    {
      company: 'Google',
      logo: 'https://logo.clearbit.com/google.com',
      position: 'Software Engineer',
      package: 35,
      packageRange: '30-45 LPA',
      location: 'Bangalore',
      type: 'Full-time',
      eligibility: 'CSE, IT, ECE - Min CGPA 7.5',
      driveDate: new Date('2025-01-15'),
      status: 'Upcoming',
      totalSelected: 12,
      description: 'Google is looking for talented software engineers to join their team.',
    },
    {
      company: 'Microsoft',
      logo: 'https://logo.clearbit.com/microsoft.com',
      position: 'Software Development Engineer',
      package: 32,
      packageRange: '25-40 LPA',
      location: 'Hyderabad',
      type: 'Full-time',
      eligibility: 'CSE, IT, ECE - Min CGPA 7.0',
      driveDate: new Date('2025-01-20'),
      status: 'Ongoing',
      totalSelected: 18,
      description: 'Microsoft is hiring SDEs for their cloud and AI divisions.',
    },
    {
      company: 'Amazon',
      logo: 'https://logo.clearbit.com/amazon.com',
      position: 'SDE',
      package: 28,
      packageRange: '20-35 LPA',
      location: 'Hyderabad',
      type: 'Full-time',
      eligibility: 'CSE, IT, ECE, EEE - Min CGPA 6.5',
      driveDate: new Date('2025-01-25'),
      status: 'Ongoing',
      totalSelected: 25,
      description: 'Join Amazon as a Software Development Engineer.',
    },
    {
      company: 'Infosys',
      logo: 'https://logo.clearbit.com/infosys.com',
      position: 'Systems Engineer',
      package: 5,
      packageRange: '4-6.5 LPA',
      location: 'Multiple',
      type: 'Full-time',
      eligibility: 'All Branches - Min CGPA 6.0',
      driveDate: new Date('2025-02-01'),
      status: 'Upcoming',
      totalSelected: 85,
      description: 'Mass recruitment drive for Systems Engineers.',
    },
    {
      company: 'TCS',
      logo: 'https://logo.clearbit.com/tcs.com',
      position: 'Software Developer',
      package: 5,
      packageRange: '3.5-7 LPA',
      location: 'Multiple',
      type: 'Full-time',
      eligibility: 'All Branches - Min CGPA 5.5',
      driveDate: new Date('2025-02-05'),
      status: 'Upcoming',
      totalSelected: 120,
      description: 'TCS hiring drive for freshers.',
    },
    {
      company: 'Wipro',
      logo: 'https://logo.clearbit.com/wipro.com',
      position: 'Project Engineer',
      package: 4.5,
      packageRange: '3.5-6 LPA',
      location: 'Multiple',
      type: 'Full-time',
      eligibility: 'All Branches - Min CGPA 6.0',
      driveDate: new Date('2025-02-10'),
      status: 'Upcoming',
      totalSelected: 95,
      description: 'Wipro campus recruitment for Project Engineers.',
    },
  ];

  await Placement.deleteMany({});
  const createdPlacements = await Placement.insertMany(placements);
  console.log(`${createdPlacements.length} placements created`);
  return createdPlacements;
};

const seedFaculty = async (departments) => {
  const cseDept = departments.find(d => d.code === 'CSE');
  const eceDept = departments.find(d => d.code === 'ECE');
  const mechDept = departments.find(d => d.code === 'MECH');
  const itDept = departments.find(d => d.code === 'IT');

  const facultyData = [
    {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@mlrit.ac.in',
      department: cseDept._id,
      departmentName: 'CSE',
      designation: 'Professor',
      specialization: 'Machine Learning, AI',
      experience: 15,
      rating: 4.8,
      status: 'Active',
    },
    {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@mlrit.ac.in',
      department: eceDept._id,
      departmentName: 'ECE',
      designation: 'Associate Professor',
      specialization: 'VLSI Design, Embedded Systems',
      experience: 12,
      rating: 4.6,
      status: 'Active',
    },
    {
      name: 'Prof. Amit Singh',
      email: 'amit.singh@mlrit.ac.in',
      department: cseDept._id,
      departmentName: 'CSE',
      designation: 'Assistant Professor',
      specialization: 'Data Structures, Algorithms',
      experience: 8,
      rating: 4.5,
      status: 'Active',
    },
    {
      name: 'Dr. Meera Patel',
      email: 'meera.patel@mlrit.ac.in',
      department: mechDept._id,
      departmentName: 'MECH',
      designation: 'Professor',
      specialization: 'Thermodynamics, Fluid Mechanics',
      experience: 20,
      rating: 4.9,
      status: 'Active',
    },
    {
      name: 'Prof. Vikram Reddy',
      email: 'vikram.reddy@mlrit.ac.in',
      department: itDept._id,
      departmentName: 'IT',
      designation: 'Assistant Professor',
      specialization: 'Web Development, Cloud Computing',
      experience: 5,
      rating: 4.3,
      status: 'Active',
    },
    {
      name: 'Dr. Sunita Verma',
      email: 'sunita.verma@mlrit.ac.in',
      department: cseDept._id,
      departmentName: 'CSE',
      designation: 'Professor',
      specialization: 'Database Systems, Big Data',
      experience: 18,
      rating: 4.7,
      status: 'Active',
    },
  ];

  await Faculty.deleteMany({});
  const createdFaculty = await Faculty.insertMany(facultyData);
  console.log(`${createdFaculty.length} faculty created`);
  return createdFaculty;
};

const seedActivities = async () => {
  const activities = [
    {
      type: 'enrollment',
      title: 'New batch enrolled',
      description: '150 new students enrolled in Computer Science department',
    },
    {
      type: 'course',
      title: 'New course launched',
      description: 'Machine Learning course launched for 7th semester students',
    },
    {
      type: 'placement',
      title: 'Google placement drive announced',
      description: 'Google campus recruitment scheduled for January 15, 2025',
    },
    {
      type: 'system',
      title: 'System maintenance completed',
      description: 'Scheduled maintenance completed successfully',
    },
    {
      type: 'faculty',
      title: 'New faculty joined',
      description: 'Dr. Priya Sharma joined CSE department as Associate Professor',
    },
    {
      type: 'exam',
      title: 'Mid-semester exams scheduled',
      description: 'Mid-semester examinations scheduled from February 10-20, 2025',
    },
  ];

  await ActivityLog.deleteMany({});
  const createdActivities = await ActivityLog.insertMany(activities);
  console.log(`${createdActivities.length} activities created`);
  return createdActivities;
};

const seedAll = async () => {
  try {
    await connectDB();
    
    console.log('\n--- Seeding Database ---\n');
    
    const departments = await seedDepartments();
    await seedCourses(departments);
    await seedFaculty(departments);
    await seedPlacements();
    await seedActivities();
    
    console.log('\n--- Seeding Complete ---\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAll();
