import { db } from '../lib/db';
import type { FortigateServer } from '../types';

const initialServers: FortigateServer[] = [
  {
    id: '1',
    name: '남학생',
    host: '220.72.109.65',
    vdom: 'root',
    apiKey: '734hcG9n4c6b858krpy0tdbmhjr5j7',
    enabled: true,
  },
  {
    id: '2',
    name: '여학생',
    host: '211.104.30.81',
    vdom: 'root',
    apiKey: 'f9h1q86cNmktzNN530npntN8mjrr3y',
    enabled: true,
  },
  {
    id: '3',
    name: '대치',
    host: '121.134.123.193',
    vdom: 'root',
    apiKey: 'b93xsfm331phcdcNG4n9pd3m98r4zw',
    enabled: true,
  },
];

async function initServers() {
  console.log('Initializing FortiGate servers...');

  const existingServers = db.getServers();

  if (existingServers.length > 0) {
    console.log(`Found ${existingServers.length} existing servers. Skipping initialization.`);
    return;
  }

  db.saveServers(initialServers);
  console.log(`Successfully added ${initialServers.length} servers:`);
  initialServers.forEach(s => {
    console.log(`  - ${s.name} (${s.host})`);
  });
}

initServers();
