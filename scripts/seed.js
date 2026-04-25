// Run with: node scripts/seed.js
// Requires MONGODB_URI in .env.local

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('Missing MONGODB_URI in .env.local'); process.exit(1); }

// Inline schemas for seed script
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: String, phone: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const LeadSchema = new mongoose.Schema({
  name: String, email: String, phone: String, propertyInterest: String,
  location: String, budget: Number, status: String, priority: String,
  score: Number, notes: String, source: String, assignedTo: mongoose.Schema.Types.ObjectId,
  followUpDate: Date, lastActivityAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ActivitySchema = new mongoose.Schema({
  lead: mongoose.Schema.Types.ObjectId, performedBy: mongoose.Schema.Types.ObjectId,
  type: String, description: String, metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);

const LOCATIONS = ['DHA Phase 6, Lahore', 'Bahria Town, Karachi', 'F-7, Islamabad', 'DHA Phase 8, Karachi', 'Gulberg III, Lahore', 'Blue Area, Islamabad', 'Clifton Block 4, Karachi'];
const PROPERTIES = ['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Office'];
const SOURCES = ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Other'];
const STATUSES = ['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'];
const NAMES = ['Ahmed Khan', 'Sara Ali', 'Muhammad Usman', 'Fatima Malik', 'Hassan Raza', 'Ayesha Siddiqui', 'Bilal Chaudhry', 'Nadia Hussain', 'Zara Sheikh', 'Omar Farooq', 'Iqbal Mirza', 'Samia Qureshi', 'Tariq Mehmood', 'Hira Baig', 'Kashif Anwar'];

function scoreFromBudget(budget) {
  const m = budget / 1_000_000;
  if (m > 20) return { priority: 'High', score: 100 };
  if (m >= 10) return { priority: 'Medium', score: 60 };
  return { priority: 'Low', score: 20 };
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing
  await Promise.all([User.deleteMany({}), Lead.deleteMany({}), Activity.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // Create admin
  const adminPass = await bcrypt.hash('admin123', 12);
  const admin = await User.create({
    name: 'Admin User', email: 'admin@propertycrm.com', password: adminPass,
    role: 'admin', phone: '923001111111', isActive: true,
  });
  console.log('👤 Admin created: admin@propertycrm.com / admin123');

  // Create agents
  const agentPass = await bcrypt.hash('agent123', 12);
  const agents = await User.insertMany([
    { name: 'Asad Mehmood', email: 'agent@propertycrm.com', password: agentPass, role: 'agent', phone: '923002222222', isActive: true },
    { name: 'Sana Tariq', email: 'sana@propertycrm.com', password: agentPass, role: 'agent', phone: '923003333333', isActive: true },
    { name: 'Kamran Iqbal', email: 'kamran@propertycrm.com', password: agentPass, role: 'agent', phone: '923004444444', isActive: true },
  ]);
  console.log(`👥 ${agents.length} agents created`);

  // Create leads
  const leads = [];
  for (let i = 0; i < 30; i++) {
    const budget = Math.floor(Math.random() * 40_000_000) + 5_000_000;
    const { priority, score } = scoreFromBudget(budget);
    const agent = Math.random() > 0.2 ? agents[Math.floor(Math.random() * agents.length)] : null;
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const followUpOffset = Math.floor(Math.random() * 14) - 7;
    const followUpDate = new Date(Date.now() + followUpOffset * 24 * 60 * 60 * 1000);
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const firstName = name.split(' ')[0].toLowerCase();

    leads.push({
      name,
      email: `${firstName}.${i}@example.com`,
      phone: `9230${Math.floor(10000000 + Math.random() * 90000000)}`,
      propertyInterest: PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)],
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      budget, priority, score, status,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      notes: i % 3 === 0 ? `Interested in ${PROPERTIES[i % PROPERTIES.length]}. Prefers ground floor. Ready to visit.` : '',
      assignedTo: agent?._id || null,
      followUpDate,
      lastActivityAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
    });
  }
  const createdLeads = await Lead.insertMany(leads);
  console.log(`🏠 ${createdLeads.length} leads created`);

  // Create activities
  const activities = createdLeads.slice(0, 15).map((lead, i) => ({
    lead: lead._id,
    performedBy: i % 3 === 0 ? admin._id : agents[i % agents.length]._id,
    type: ['created', 'status_updated', 'assigned', 'notes_updated', 'follow_up_set'][i % 5],
    description: [
      'Lead created by Admin',
      `Status updated to ${lead.status}`,
      `Lead assigned to agent`,
      'Notes updated with client preferences',
      'Follow-up date scheduled',
    ][i % 5],
  }));
  await Activity.insertMany(activities);
  console.log(`📋 ${activities.length} activity records created`);

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────');
  console.log('Admin:  admin@propertycrm.com / admin123');
  console.log('Agent:  agent@propertycrm.com / agent123');
  console.log('─────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
